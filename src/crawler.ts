import { CrawlerPage } from "./models/crawler_page";
import { chromium } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger("crawler");

logger.info("Connected successfully.");

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Log and continue all network requests
    page.route('**', (route: import('playwright').Route) => {
        console.log(route.request().url());
        route.continue();
    });

    const searchPage = new CrawlerPage(page);
    await searchPage.navigate();
    await searchPage.search('search query');

})();

