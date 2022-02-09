import amqp from "amqplib/callback_api";
import { chromium } from "playwright";
import { CrawlRequest, initCrawlJob } from './crawler';
import { getLogger } from "./logger";
import 'source-map-support/register'

let logger = getLogger()

let connCreds = {
    protocol: 'amqp',
    hostname: process.env.RABBIT_HOSTNAME,
    port: 5672,
    username: process.env.RABBIT_USERNAME,
    password: process.env.RABBIT_PASSWORD
}

/**
 * Generate random Integer.
 *
 * @param min: minimum number (inclusive)
 * @param max: max number (inclusive)
 */
function randomInt(min:number, max:number) : number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
}

amqp.connect(connCreds, function(error0, connection) {
    if (error0) {
        logger.error(error0)
        throw error0;
    }

    connection.createChannel(async function(error1, channel) {
        if (error1) {
            logger.error(error1)
            throw error1;
        }

        // Wait a little bit to prevent overloading the system by launching a
        // bunch of browsers at exactly the same time.
        let delay = randomInt(0, 20);
        logger.info(`Connected successfully. Will wait for ${delay} seconds prior to launching browser.`)
        await new Promise(f => setTimeout(f, delay*1000));
        logger.info("Launching browser.")

        // We run several proxies for crawlers, like so:
        //tcp6       0      0 :::8081                 :::*                    LISTEN      2159584/python
        //tcp6       0      0 :::8082                 :::*                    LISTEN      2160276/python
        //tcp6       0      0 :::8083                 :::*                    LISTEN      2161624/python
        //tcp6       0      0 :::8084                 :::*                    LISTEN      2162051/python
        //tcp6       0      0 :::8085                 :::*                    LISTEN      2162986/python
        //tcp6       0      0 :::8086                 :::*                    LISTEN      2163517/python
        let port:number = 8080 + randomInt(1, 6);
        let proxy = 'http://unicornbottle-main:' + port;
        logger.info(`Using proxy ${proxy}`);
        let browser = await chromium.launch({
            proxy: {
                server: proxy,
                bypass: "qowifoihqwfohifqwhoifwqhoifqw.com" // Don't bypass.
            }
        });

        var queue = 'crawl_tasks';

        channel.assertQueue(queue, {
            durable: true
        });
        channel.prefetch(1);
        logger.info(`Waiting for messages in ${queue} queue. To exit press CTRL+C`);

        channel.consume(queue, async function(msg) {
            if(!msg) {
                logger.error("Message was null!");
                return;
            }

            logger.debug("Received crawl job, starting. Raw message: " + msg.content.toString());

            if(!browser.isConnected()) {
                logger.error("Browser was dead, restarting.");
                try {
                    await browser.close(); // Try and close it just in case.
                } catch(e) {}

                browser = await chromium.launch({
                    proxy: {
                        server: proxy,
                        bypass: "qowifoihqwfohifqwhoifwqhoifqw.com" // Don't bypass.
                    }
                });
            }

            let crawl_request: CrawlRequest = JSON.parse(msg.content.toString());
            await initCrawlJob(browser, crawl_request);

            logger.info("Acking RabbitMQ task.")
            channel.ack(msg);
        }, {
            noAck: false // Manual acknowledgement mode.
        });
    });
});

