const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      `--disable-extensions-except=${path.join(__dirname, '.output/chrome-mv3')}`,
      `--load-extension=${path.join(__dirname, '.output/chrome-mv3')}`
    ]
  });
  
  const page = await browser.newPage();
  
  // Wait a bit for extension to load
  await new Promise(r => setTimeout(r, 1000));
  
  // Find the extension ID
  const targets = await browser.targets();
  console.log("Targets:", targets.map(t => t.url()));
  const extensionTarget = targets.find(t => t.url().startsWith('chrome-extension://'));
  const extensionUrl = extensionTarget ? extensionTarget.url() : null;
  const extensionId = extensionUrl ? extensionUrl.split('/')[2] : 'unknown';
  
  console.log("Extension ID:", extensionId);
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  if (extensionId !== 'unknown') {
    await page.goto(`chrome-extension://${extensionId}/newtab.html`);
    await new Promise(r => setTimeout(r, 2000));
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log("BODY HTML:", html.substring(0, 500));
  } else {
    console.log("Could not find extension ID.");
  }
  
  await browser.close();
})();