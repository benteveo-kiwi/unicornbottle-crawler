import { ClickLinksAction } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger();

export interface CrawlRequest {
    url: string;
    target: string;
}

export async function initCrawlJob(crawl_request : CrawlRequest) {
    logger.info("Launching browser.")
    const browser = await chromium.launch({
        proxy: {
            server: 'localhost:8080'
        }
    });

    const action = new ClickLinksAction(browser);
    await action.init(crawl_request.url, crawl_request.target);

    await action.perform();

    browser.close();
}
