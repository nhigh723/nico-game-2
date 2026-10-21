// Phone-size screenshots (390x844 @3x = 1170x2532) into screenshots/.
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:4180/'; fs.mkdirSync('screenshots', { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage();
const S = (f, a) => page.evaluate(f, a), wait = ms => page.waitForTimeout(ms), pt = (x, y) => S(([x, y]) => window.__snap.toScreen(x, y), [x, y]);
async function run(a) { if (a.type === 'tap') { const p = await pt(a.x, a.y); await page.mouse.click(p.x, p.y); return wait(150); } const ps = []; for (const [x, y] of a.path) ps.push(await pt(x, y)); await page.mouse.move(ps[0].x, ps[0].y); await page.mouse.down(); for (const q of ps.slice(1)) await page.mouse.move(q.x, q.y, { steps: 6 }); await page.mouse.up(); await wait(250); }
async function steps(n) { for (let k = 0; k < n; k++) { const a = await S(() => window.__snap.busy() ? null : window.__snap.next()); if (a) await run(a); else await wait(200); } }
await page.goto(URL); await S(() => localStorage.clear()); await page.reload(); await wait(1600); await page.screenshot({ path: 'screenshots/1-title.png' });
// a lived-in save: some progress, a few buildings in town
await S(() => { const s = window.__snap.save(); s.lv = [3, 2, 1, 1, 2, 0]; s.wins = 9; s.seen = 9; window.__snap.setSave(s); window.__snap.go('hub'); }); await wait(900); await page.screenshot({ path: 'screenshots/2-home.png' });
await S(() => window.__snap.start(0, 3)); await steps(3); const a0 = await S(() => window.__snap.next()); await page.mouse.move(...Object.values(await pt(a0.path[0][0], a0.path[0][1]))); await page.mouse.down(); await page.mouse.move(...Object.values(await pt(200, 560)), { steps: 5 }); await wait(300); await page.screenshot({ path: 'screenshots/3-fill-the-shape.png' }); await page.mouse.up();
await S(() => window.__snap.start(1, 1)); await wait(400); await steps(4); await run(await S(() => window.__snap.next())); await wait(900); await page.screenshot({ path: 'screenshots/4-tower-wind-test.png' });
await S(() => window.__snap.start(2, 2)); await wait(400); await steps(4); await run(await S(() => window.__snap.next())); await wait(1500); await page.screenshot({ path: 'screenshots/5-bunny-bridge.png' });
await S(() => window.__snap.start(3, 2)); await wait(400); await steps(2); await run(await S(() => window.__snap.next())); await wait(1100); await page.screenshot({ path: 'screenshots/6-roll-road.png' });
for (let k = 0; k < 3; k++) { await S(() => window.__snap.start(5, 0)); await wait(300); await steps(4 + k); await wait(400); const sv = await S(() => window.__snap.save()); void sv; await S(() => window.__snap.closeModal()); }
await S(() => window.__snap.go('town')); await wait(1500); await page.screenshot({ path: 'screenshots/7-my-town.png' });
await b.close(); console.log(fs.readdirSync('screenshots'));
