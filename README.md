# Important

In order for the installation of the required browsers to work, `npm install`
needs to be run as the unprivileged user `crawler`. This is because otherwise
the installation scripts attempt to extract the files to /root/, which they
don't have privileges for.

```
su crawler
npm install
```

# Compilation.

Settings related to compilation are located in the `tsconfig.json` file. We
want to be relatively strict in our preferences.

In order to minimize compilation times, tsc can be run in daemon mode. Skipping
lib checks reduces some redundant checks and also minimizes the time:

```
npx tsc --watch --skipLibCheck
```

If you just want to compile once, run:

```
npx tsc
```

# Poller

The poller regularly receives messages from the RabbitMQ queue and initiates
the other process based on those instructions. To compile, load the required
environment variables and run, issue the following command:

```
export $(cat ~crawler/.credentials.env | xargs) && node out/poller.js
```

