import type { Route, Browser, BrowserContext, Page } from 'playwright';
import { getLogger } from "../logger";

let logger = getLogger();

/**
 * This abstract class represents an action that the browser will perform. It
 * is meant as an abstraction layer which allows for all kinds of behaviours,
 * such as browsing, scrolling, clicking, etc.
 *
 * Please note that "Page" does not refer to a single website URL, but rather a
 * playwright Page object. This means that "Actions" can involve complex
 * scenarios such as navigating multiple pages.
 *
 * Additionally, due to the architecture of the crawler the actions may be
 * called multiple times in the same URL.
 */
abstract class Action {

    readonly browser: Browser;
    context: BrowserContext | null;
    page: Page | null;
    startUrl: string | null;

    /**
     * Main constructor.
     *
     * @param browser - A Browser instance that will be used for the interactions.
     * @see https://playwright.dev/docs/api/class-browser
     */
    constructor(browser: Browser) {
        this.browser = browser;
        this.context = null;
        this.page = null;
        this.startUrl = null;
    }

    /**
     * Performs basic init of a browser context and navigates to a page to
     * begin processing actions against it.
     *
     * @param startUrl - The initial URL to perform this actions against.
     * @param target - The target guid.
     */
    async init(startUrl : string, target : string) {
        let contextOptions = {
            ignoreHTTPSErrors: true,
            extraHTTPHeaders: {
                "X-UB-GUID": target
            }
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
        this.startUrl = startUrl;

        // Log all requests.
        this.context.route('**', (route: Route) => {
            console.log(route.request().url());
            route.continue();
        });

        // Prevent accidental navigation of the main frame.
        this.page.route('**', (route: Route) => {
            let req = route.request()
            if (req.isNavigationRequest() && req.frame() === this.page!.mainFrame() && req.url() !== this.startUrl) {
                logger.info("Attempted to navigate main frame, aborted.");
                route.abort('aborted');
            } else {
                route.continue();
            }
        });

        await this.page.goto(startUrl, {waitUntil: "networkidle"});
    }

    /**
     * Conducts the specific actions associated with this Action. This function
     * will be called after "networkIdle" by calling page.waitForLoadState('networkidle')
     */
    abstract perform() : Promise<void>;
}

/**
 * This action attempts to open all of the <a> elements in a new window by middle clicking them.
 *
 * @extends {Action}
 */
export class ClickLinksAction extends Action {

    /**
     * Main entry point. We iterate through all <a> elements and middle click
     * them. 
     */
    async perform() {

        if(this.page == null || this.context == null) {
            logger.error("Trying to perform action without initialization.");
            return;
        }

        let links = await this.page.$$("a");

        for (let link of links) {
            await Promise.all([
                this.context.waitForEvent('page'),
                link.click({force: true, button:"middle"})
            ]);
        }

        console.log(this.context!.pages().length, links.length)
    }

}
