import type { Page } from 'playwright';

export class CrawlerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://bing.com');
  }

  async search(text : string) {
    await this.page.fill('[aria-label="Enter your search term"]', text);
    await this.page.press('[aria-label="Enter your search term"]', 'Enter');
  }

}
