import { ClickLinksAction } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";

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
function execShellCommand(cmd:string) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
	exec(cmd, (error:string, stdout:string, stderr:string) => {
	    if (error) {
		logger.error(error);
	    }
	    resolve(stdout? stdout : stderr);
	});
    });
}

export async function initCrawlJob(crawl_request : CrawlRequest) {
    logger.info("Launching browser.")
    const browser = await chromium.launch({
	proxy: {
	    server: 'localhost:8080',
	    bypass: ""
	}
    });

    if(crawl_request.login_script) {
        if (!crawl_request.login_script.match(/^[0-9a-z_]+$/)) { 
            logger.info(`Invalid login script ${crawl_request.login_script}`);
            throw new Error("Invalid login script");
        }

        logger.info("Executing login script.")
        await execShellCommand(`node /home/crawler/ub-crawler/src/login/${crawl_request.login_script}.js`)
        logger.info("Done.")
    }

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Start`)
    try {
	const action = new ClickLinksAction(browser);
	await action.init(crawl_request.url, crawl_request.target, crawl_request.login_script);
	await action.perform();
    } catch(err) {
	logger.error(err);
    }

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Done`)

    browser.close();
}

