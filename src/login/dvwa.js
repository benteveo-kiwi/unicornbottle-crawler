const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
      headless: true,
      proxy: {
          server: 'unicornbottle-main:8080',
          bypass: "qowifoihqwfohifqwhoifwqhoifqw.com"
      }
  });
  const context = await browser.newContext({extraHTTPHeaders: { 'X-UB-GUID': 'b179a4aa-5a42-4e04-90b6-f217eb46538b' /* hard-coded for login */ }})

  // Open new page
  const page = await context.newPage();

  // Go to http://dvwa/DVWA/login.php
  await page.goto('http://dvwa/DVWA/login.php');

  // Click text=Username Password Login
  //await page.click('text=Username Password Login');

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
  // assert.equal(page.url(), 'http://dvwa/DVWA/index.php');

  // Click text=Damn Vulnerable Web Application (DVWA) is a PHP/MySQL web application that is da
  await page.click('text=Damn Vulnerable Web Application (DVWA) is a PHP/MySQL web application that is da');

  // ---------------------
  await context.storageState({ path: '' + process.argv[2] });
  await context.close();
  await browser.close();
})();
