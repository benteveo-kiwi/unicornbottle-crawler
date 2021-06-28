import type { Page } from 'playwright';

/**
 * Action.
 */
abstract class Action {

    readonly page: Page;

    /**
     * constructor.
     *
     * @param page -
     */
    constructor(page: Page) {
        this.page = page;
    }

    /**
     * perform.
     *
     * @returns
     */
    abstract perform() : void;
}

/**
 * ClickLinksAction.
 *
 * @extends {Action}
 */
export class ClickLinksAction extends Action {

    /**
     * perform.
     */
    async perform() {
        await this.page.goto('https://bing.com', {waitUntil: "networkidle"});
    }

}
