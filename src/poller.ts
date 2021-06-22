import amqp from "amqplib/callback_api";
import { getLogger } from "./logger";

let logger = getLogger("poller")

let connCreds = {
    protocol: 'amqp',
    hostname: process.env.RABBIT_HOSTNAME,
    port: 5672,
    username: process.env.RABBIT_USERNAME,
    password: process.env.RABBIT_PASSWORD
}

logger.info("Attempting to connect")
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

        channel.consume(queue, function(msg) {
            if(!msg) {
                logger.error("Message was null!");
                return;
            }

            var secs = msg.content.toString().split('.').length - 1;

            logger.info("Received " + msg.content.toString());

            setTimeout(function() {
                logger.info("Done");
                channel.ack(msg);
            }, secs * 1000);

        }, {
            noAck: false
        });
    });
});

