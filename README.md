# Important

In order for the installation of the required browsers to work, `npm install`
needs to be run as the unprivileged user `crawler`. This is because otherwise
the installation scripts attempt to extract the files to /root/, which they
don't have privileges for.

```
su crawler
npm install
```

# Poller

The poller regularly receives messages from the RabbitMQ queue and initiates
the other process based on those instructions. To compile, load the required
environment variables and run, issue the following command:

```
npx tsc && export $(cat ~crawler/.credentials.env | xargs) && node out/poller.js
```

# Crawler.

The crawler gets called from the poller and by design can also be called
standalone. 
