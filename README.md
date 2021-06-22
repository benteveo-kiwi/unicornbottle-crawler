# Poller

The poller regularly receives messages from the RabbitMQ queue and initiates
the other process based on those instructions. To compile, load the required
environment variables and run, issue the following command:

```
npx tsc && export $(cat ~crawler/.credentials.env | xargs) && node out/poller.js
```
