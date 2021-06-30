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

    const context = await browser.newContext({ignoreHTTPSErrors: true});

    const page = await context.newPage();

    // Log all requests.
    context.route('**', (route: Route) => {
        console.log(route.request().url());
        route.continue();
    });

    await page.goto("https://books.toscrape.com/", {waitUntil: "networkidle"});
    let url = page.url()
    page.route('**', (route: Route) => {
        let req = route.request()
        if (req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() !== url) {
            logger.info("Attempted to navigate main frame, aborted.");
            route.abort('aborted');
        } else {
            route.continue();
        }
    });

    var nb = 0;
    context.on('page', async (page: Page) => {
        await page.waitForLoadState("load");
        let url = page.url();

        if(url != "about:blank") {
            console.log("Url %s", url);
        }
    });

    const action = new ClickLinksAction(page);

    await action.perform()

})();

