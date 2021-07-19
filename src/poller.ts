import amqp from "amqplib/callback_api";
import { getLogger } from "./logger";
import { CrawlRequest, initCrawlJob } from './crawler';

let logger = getLogger("poller")

let connCreds = {
    protocol: 'amqp',
    hostname: process.env.RABBIT_HOSTNAME,
    port: 5672,
    username: process.env.RABBIT_USERNAME,
    password: process.env.RABBIT_PASSWORD
}


amqp.connect(connCreds, function(error0, connection) {
    if (error0) {
        logger.error(error0)
        throw error0;
    }

    connection.createChannel(function(error1, channel) {
        if (error1) {
            logger.error(error1)
            throw error1;
        }
        logger.info("Connected successfully.")

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

            logger.info("Received crawl job, starting." + msg.content.toString());

            let crawl_request: CrawlRequest = JSON.parse(msg.content.toString());
            await initCrawlJob(crawl_request);

            logger.info("Finished crawling")

        }, {
            noAck: true
        });
    });
});

