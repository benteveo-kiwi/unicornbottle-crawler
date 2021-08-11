import { ClickLinksAction } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger();

export interface CrawlRequest {
    url: string;
    target: string;
    login_script: string;
}

export async function initCrawlJob(crawl_request : CrawlRequest) {
    logger.info("Launching browser.")
    const browser = await chromium.launch({
        proxy: {
            server: 'localhost:8080',
            bypass: ""
        }
    });

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Start`)
    try {
        const action = new ClickLinksAction(browser);
        await action.init(crawl_request.url, crawl_request.target);
        await action.perform();
    } catch(err) {
        logger.error(err);
    }

    logger.info(`${crawl_request.target} -> ${crawl_request.url}: Done`)

    browser.close();
}

