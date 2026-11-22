import puppeteer from 'puppeteer-core';
const URL0 = process.argv[2] || 'http://localhost:8765/';
const b = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(e.message));
await pg.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3});
const res = {};
for (const [id, name] of (process.argv[3] ? JSON.parse(process.argv[3]) : [['p13-10', 'irt'], ['p13-14', 'irt-darm'], ['p13-1', 'fe'], ['p13-7', 'irt-study']])) {
  await pg.goto(URL0, {waitUntil: 'networkidle0'}); await pg.waitForFunction(() => window.__QA);
  const sl = await pg.evaluate(id => window.__QA.titles().find(t => t.id === id).sl, id);
  await pg.goto(URL0 + '#q/' + sl, {waitUntil: 'networkidle0'});
  await pg.waitForFunction(() => document.querySelectorAll('#abody p').length > 1);
  await new Promise(r => setTimeout(r, 2500));
  res[id] = await pg.evaluate(() => ({svg: document.querySelectorAll('#abody svg').length, q: document.querySelector('#aq').textContent}));
  await pg.screenshot({path: '/workspace/shot-' + name + '-390.png'});
  await pg.screenshot({path: '/workspace/shot-' + name + '-390-full.png', fullPage: true});
}
console.log(JSON.stringify(res), 'errors', errs);
await b.close();
