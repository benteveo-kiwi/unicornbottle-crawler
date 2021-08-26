import type { Route, Browser, BrowserContext, Page, ElementHandle } from 'playwright';
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
 *
 * I have decided to incorporate randomness into each action. If links are to
 * be clicked, they will be clicked in a random order. If forms are to be
 * submitted, they will be submitted in a random order. The main benefit of
 * this is that it adds a measurable amount of fun and makes life better.
 */
export abstract class Action {

    readonly browser: Browser;
    context: BrowserContext | null;
    page: Page | null;
    startUrl: string;

    /**
     * Main constructor.
     *
     * @param browser - A Browser instance that will be used for the interactions.
     * @param startUrl - The initial URL to perform this actions against.
     * @see https://playwright.dev/docs/api/class-browser
     */
    constructor(browser: Browser, startUrl:string) {
        this.browser = browser;
        this.startUrl = startUrl;

        // Require initialization at `init`.
        this.context = null;
        this.page = null;
    }

    /**
     * Performs basic init of a browser context and navigates to a page to
     * begin processing actions against it.
     *
     * @param target - The target guid.
     * @param storageState - the login script ID for this crawl request. 
     */
    async init(target : string, storageState: string|undefined) {
        let contextOptions = {
            extraHTTPHeaders: {
                "X-UB-GUID": target
            },
            storageState: storageState
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();

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

        // Prevent accidental logouts.
        this.context.route(/logout/i, (route: Route) => {
            let req = route.request()
            logger.debug(`Aborted navigation to logout url ${req.url()}`)
            route.abort();
        });

        await this.page.goto(this.startUrl, {waitUntil: "networkidle"});
    }

    /**
     * Shuffles the array according to some fancy algorithm or other.
     *
     * @param array - An array to be shuffled.
     * @see https://stackoverflow.com/a/12646864
     */
    shuffleArray(array:any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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

        this.shuffleArray(links);

        this.context.on('page', this.newPageCallback);
        logger.debug(`Middle clicking ${links.length} links`);

        let nb = 0;
        for (let link of links) {
            await Promise.all([
                this.context.waitForEvent('page'),
                link.click({force: true, button:"middle"})
            ]);
            if(nb % 10 === 0 && nb != 0) {
                logger.debug(`Clicked ${nb} links.`);
            }
            nb++;
        }
    }

    async newPageCallback(page:Page) {
        try {
            await page.waitForLoadState("domcontentloaded", {timeout: 5000});
        } catch(err) {
            // This happens when the browser context is closed.
        }

        page.close()
    }

}

/**
 * This action identifies how many forms are present on the current page,
 * creates that same number of pages, and then procedes to submit each form.
 *
 * This also handles the populating of the forms.
 *
 * @extends {Action}
 */
export class SubmitFormsAction extends Action {

    /**
     * Main entry point. Grab all forms and inspect them.
     */
    async perform() {
        if(this.page == null || this.context == null) {
            logger.error("Trying to perform action without initialization.");
            return;
        }

        let forms = await this.page.$$("form");

        let promises: Promise<void>[] = [];
        for(let [key, item] of forms.entries()) {
            promises.push(this.handleForm(key));
        }

        await Promise.all(promises);
    }

    /**
     * Populate and submit the nth form at page. Creates a new instance of this
     * page and submits that.
     *
     * @param index - get the nth form.
     */
    async handleForm(index:number) {
        let newPage = await this.context!.newPage();
        await newPage.goto(this.startUrl, {waitUntil: "networkidle"});

        let forms = await newPage.$$("form");
        let form = forms[index];
        await this.populateForm(form)
        await this.submitForm(form)
    }

    /**
     * Populates a form. Fills out inputs, etc.
     *
     * @param form - the form to fill out.
     */
    async populateForm(form:ElementHandle) {
        let inputs = await form.$$("input")

        let text = "1337" // Officially the best input for any form field.
        for (let input of inputs) {
            let isEditable = await input.isEditable();

            try {
                await input.fill(text, {force:true});
            } catch(e) {
                let type = await input.getAttribute("type");
                logger.debug(`Could not fill input type ${type}`);
            }
        }
    }

    /**
     * Submits a form by clicking the submit button if there is any. If not we
     * force submission of the form.
     *
     * @param form - the form to submit.
     */
    async submitForm(form:ElementHandle) {
        let submitButton = await form.$("input[type=submit]")
        if(submitButton) {
            await submitButton.click({force:true});
        } else {
            let input = await form.$('input[type=text]');
            if(input) {
                await input.press("Enter");
            } else {
                logger.debug(`Could not submit form at url ${this.startUrl}`);
                return;
            }
        }

        logger.debug("Successfully submitted form.");

    }
}
