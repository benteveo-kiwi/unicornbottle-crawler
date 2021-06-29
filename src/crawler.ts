import { ClickLinksAction } from "./models/actions";
import { chromium, Page, Route } from "playwright";
import { getLogger } from "./logger";

let logger = getLogger("crawler");

(async () => {
    logger.info("Launching browser.")
    const browser = await chromium.launch();
    const context = await browser.newContext();

    const page = await context.newPage();

    // Log all requests.
    context.route('**', (route: Route) => {
        //console.log(route.request().url());
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
        await page.waitForLoadState("networkidle")
        let url = page.url()
        if(url != "about:blank") {
            nb++;
        }

        console.log("nb so far %d", nb);
    });


    const action = new ClickLinksAction(page);

    await action.perform()

})();

