import type { BrowserContext, Page } from 'playwright';

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

    readonly page: Page;

    /**
     * Main constructor.
     *
     * @param page - A playwright page as documented here: https://playwright.dev/docs/api/class-page
     */
    constructor(page: Page) {
        this.page = page;
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
     * Main entry point.
     */
    async perform() {
        let links = await this.page.$$("a");
        let i = 0;
        for (let link of links) {
            await link.click({force: true, button:"middle"});
            i++;

            if(i % 8 == 0 && i != 0) {
                await this.page.waitForTimeout(1000); // Don't go too hard.
            }
        }
    }

}
