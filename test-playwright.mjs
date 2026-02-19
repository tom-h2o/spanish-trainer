import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000); // give react time to render

    const html = await page.content();
    console.log("HTML length:", html.length);
    if (!html.includes('Sign In to Play')) {
        console.log("Did not find 'Sign In to Play' in HTML");
        console.log(html.substring(0, 1000));
    } else {
        console.log("Found 'Sign In to Play'");
    }

    await browser.close();
})();
