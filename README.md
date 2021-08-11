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

# The `crawl_jobs` queue.

Jobs are serialized into JSON and inserted into this queue by `ub-cli.py`.
Example data that may be inserted could be:

```
sudo -u cli python3 ub-cli.py crawl --guid a9d8909b-c31d-4769-ac42-0c6ea030dfe3 --dry-run --scope newscope
2021-08-10 18:39:46,826 [INFO]: Creating crawl requests for 32 unique endpoints in the DB.
{'url': 'http://unicornbottle-main/DVWA/logout.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/javascript/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/security.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/images/lock.png', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/phpinfo.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/about.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/css/main.css', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/js/dvwaPage.js', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/dvwa/js/add_event_listeners.js', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/images/logo.png', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/instructions.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/setup.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/images/spanner.png', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/brute/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA//dvwa/js/add_event_listeners.js', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/exec/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/csrf/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/fi/?page=include.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/upload/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/captcha/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/sqli/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/sqli_blind/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/weak_id/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/xss_d/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/xss_r/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/xss_s/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/vulnerabilities/csp/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/login.php', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/images/login_logo.png', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA/dvwa/css/login.css', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
{'url': 'http://unicornbottle-main/DVWA', 'login_script': 'dvwa', 'target': 'a9d8909b-c31d-4769-ac42-0c6ea030dfe3'}
2021-08-10 18:39:46,848 [INFO]: Done.
```

These queue jobs are read by `poller.js` and then sent to `crawler`. For each
URL, all `actions` are performed. `Actions` are objects that implement an
interface and perform diverse tasks, such as submitting forms or left clicking
links on a webpage.

A couple of things that are notable:

* URLs may or may not serve HTML responses. CSS and JS files could potentially
  be parsed on order to obtain more links if we implement that later.
* login\_scripts refer to scripts located at `src/login/`. E.g. If `dvwa` is
  passed as a login script this would refer to `src/login/dvwa.js` and
  `src/login/dvwa.storage`. These files are generated by launching a
  non-headless browser and recording a sesion using the `src/login/generate.py`
  script.
* The `target` is set as a HTTP header and then used by the proxy to record the
  HTTP requests in the corresponding schema.
