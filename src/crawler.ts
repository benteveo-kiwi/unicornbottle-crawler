import { ClickLinksAction } from "./models/actions";
import { chromium } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger("crawler");

logger.info("Connected successfully.");

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Log and continue all network requests
    context.route('**', (route: import('playwright').Route) => {
        console.log(route.request().url());
        route.continue();
    });

    const action = new ClickLinksAction(page);
    await action.perform()
    
    await browser.close()

})();

