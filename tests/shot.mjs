import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4180/'); await p.waitForTimeout(1500); await p.screenshot({ path: '/tmp/s-title.png' });
await p.mouse.click(195, 740); await p.waitForTimeout(800); await p.screenshot({ path: '/tmp/s-hub.png' });
for (const i of [0,1,2,3,4,5]) { await p.evaluate(i => window.__snap.start(i, 0), i); await p.waitForTimeout(2200); await p.screenshot({ path: `/tmp/s-act${i}.png` }); }
console.log(errs);
await b.close();
