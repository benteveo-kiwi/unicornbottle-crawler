import { ClickLinksAction } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger("crawler");

(async () => {
    logger.info("Launching browser.")
    const browser = await chromium.launch({
        proxy: {
            server: 'localhost:8080'
        }
    });

    const action = new ClickLinksAction(browser);
    await action.init("https://books.toscrape.com/");
    await action.perform();

    browser.close();

})();

