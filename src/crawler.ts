import type { Browser } from 'playwright';
import { SubmitFormsAction, ClickLinksAction, Action } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { execute, randomString } from "./utility";
import { getLogger } from "./logger";
import { randomBytes } from "crypto";
import { unlink } from 'fs';

let logger = getLogger();

export interface CrawlRequest {
    url: string;
    target: string;
    login_script: string;
}

class ActionInitError extends Error {}

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

        let storageState = `/home/crawler/ub-crawler/src/login/states/${sessionId}.storage`;

        await execute("node", [`/home/crawler/ub-crawler/src/login/${login_script}.js`, storageState]);

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
 * @throws ActionInitError when the response is non-200 or we cannot get a
 *  response for reasons.
 */
async function launchAction(browser:Browser, crawl_request:CrawlRequest, action:Action) : Promise<void> {
    let storageState = await login(crawl_request.login_script);

    try {
        let initSuccessful:boolean = await action.init(crawl_request.target, storageState);
        if(!initSuccessful) {
            // Transform an exception into a failure.
            throw new ActionInitError(`Init failed for ${action.constructor.name} for ${crawl_request.url}.`);
        }

        await action.perform();
    } finally {
        if(storageState !== undefined) {
            unlink(storageState, (err) => {
                logger.error(`Unable to unlink storageState located at ${storageState}`);
            });
        }
    }
}

/**
 * Record the state of the crawl to the DB.
 *
 * @param crawl_request - The CrawlRequest object.
 * @param exception - Whether this request failed due to an unhandled exception.
 * @param fail - Whether this request failed due to a 404 page or unknown host or similar.
 */
async function notifyCrawlFinished(crawl_request : CrawlRequest, exception:boolean, fail:boolean) {
    let args:string[] = ["run", "python", "ub-cli.py", "update",
        "crawl-finished", "--guid", crawl_request.target, "--pretty-url", crawl_request.url];

    if(exception) {
        args.push("--exception");
    } else if(fail) {
        args.push("--fail");
    }

    try {
        logger.debug(await execute("poetry", args, "/home/cli/ub-cli/"));
    } catch(err) {
        logger.error("ERROR REPORTING CRAWL_FINISHED:" + err);
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
	    server: 'unicornbottle-main:8080',
	    bypass: "qowifoihqwfohifqwhoifwqhoifqw.com" // Don't bypass.
	}
    });

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Start`)

    // Create required instances.
    let promises : Promise<void>[] = [];
    let actions = [ClickLinksAction, SubmitFormsAction];
    for(let actionClass of actions) {
        let action = new actionClass(browser, crawl_request.url);
        promises.push(launchAction(browser, crawl_request, action));
    }

    // Init & launch all crawlers.
    let exception:boolean = false;
    let fail:boolean = false;
    try {
        await Promise.all(promises);
    } catch(err) {
        if(err instanceof ActionInitError) {
            fail = true;
        } else {
            exception = true;
        }
        logger.error(err);
    }

    // Perform shutdown.
    await notifyCrawlFinished(crawl_request, exception, fail);

    await browser.close();

    let finished_str:string = exception || fail ? "Failed" : "Completed successfully";
    logger.info(`${crawl_request.target} -> ${crawl_request.url}: ${finished_str}.`);

}

