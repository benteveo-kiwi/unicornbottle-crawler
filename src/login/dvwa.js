const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to http://unicornbottle-main/DVWA/login.php
  await page.goto('http://unicornbottle-main/DVWA/login.php');

  // Click input[name="username"]
  await page.click('input[name="username"]');

  // Fill input[name="username"]
  await page.fill('input[name="username"]', 'admin');

  // Press Tab
  await page.press('input[name="username"]', 'Tab');

  // Fill input[name="password"]
  await page.fill('input[name="password"]', 'password');

  // Click text=Login
  await page.click('text=Login');
  // assert.equal(page.url(), 'http://unicornbottle-main/DVWA/index.php');

  // ---------------------
  await context.storageState({ path: '' + process.argv[2] });
  await context.close();
  await browser.close();
})();
