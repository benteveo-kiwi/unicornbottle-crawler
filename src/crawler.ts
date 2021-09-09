import type { Browser } from 'playwright';
import { SubmitFormsAction, ClickLinksAction, Action } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";
import { randomBytes } from "crypto";

let logger = getLogger();

export interface CrawlRequest {
    url: string;
    target: string;
    login_script: string;
}

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd:string) : Promise<string> {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        //let env = {"DEBUG": "pw:api"}
        let env = {}
        exec(cmd, {timeout: 10000, env: env}, (error:string, stdout:string, stderr:string) => {
	    if (error) {
		logger.error(error);
	    }
	    resolve(stdout? stdout : stderr);
	});
    });
}

/**
 * Get a pseudorandom string.
 */
function randomString() {
    return randomBytes(20).toString('hex');
}

/**
 * This function executes the login script, which through convention will write
 * the session storage data to the first argument passed.
 *
 * @param login_script the login script to execute. It can only contain
 * alphanumeric and underscore characters.
 * @return storageState as expected by playwright.
 */
async function login(login_script:string|undefined) {
    if(login_script) {
        if (!login_script.match(/^[0-9a-z_]+$/)) { 
            logger.info(`Invalid login script ${login_script}`);
            throw new Error("Invalid login script");
        }

        logger.debug("Executing login script.");
        let sessionId = randomString();

        let storageState = `/home/crawler/ub-crawler/src/login/${sessionId}.storage`;
        logger.debug(await execShellCommand(`node /home/crawler/ub-crawler/src/login/${login_script}.js ${storageState}`));

        logger.debug(`Done. Generated storageState ${storageState}.`);

        return storageState;
    }

    return undefined;
}

/**
 * Launches a particular action.
 *
 * Creates a new session if authentication is requested in the crawl request,
 * and then forwards the execution to this individual `Action`.
 *
 * @param browser - a new playwright Browser instance.
 * @param crawl_request - crawl request as received from RabbitMQ.
 * @param action - An instantiated Action class, without `init` called.
 */
export async function launchAction(browser:Browser, crawl_request:CrawlRequest, action:Action) {
    let storageState = await login(crawl_request.login_script);

    try {
        await action.init(crawl_request.target, storageState);
        await action.perform();
    } catch(err) {
        logger.error(err);
    }
}

/**
 * Main entry point for the crawler.
 *
 * Initializes a browser and triggers crawl actions against a URL. Each crawl
 * action is an abstraction over a certain action such as clicking links,
 * submitting forms, etc.
 *
 * Authentication is handled by creating a new session for each browser
 * context. New sessions are created by login scripts, for more information see
 * the login method.
 *
 * @param crawl_request - Crawl request as received from the poller/RabbitMQ.
 * @see `login` method.
 */
export async function initCrawlJob(crawl_request : CrawlRequest) {
    logger.info("Launching browser.")
    const browser = await chromium.launch({
	proxy: {
	    server: 'localhost:8080',
	    bypass: "qowifoihqwfohifqwhoifwqhoifqw.com"
	}
    });

    let actions = [ClickLinksAction, SubmitFormsAction];
    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Start`)

    let promises : Promise<void>[] = [];
    for(let actionClass of actions) {
        let action = new actionClass(browser, crawl_request.url);
        promises.push(launchAction(browser, crawl_request, action));
    }

    let errors:boolean = false;
    try {
        await Promise.all(promises);
    } catch(err) {
        errors = true;
        logger.error(err);
    }

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Finished.`)
    browser.close();

    let errors_str:string = errors ? "--errors" : "--no-errors"

    logger.debug(await execShellCommand(`python3 ~cli/ub-cli/ub-cli.py update crawl-finished --guid ${crawl_request.target} --pretty-url ${crawl_request.url} ${errors_str}`));
}

