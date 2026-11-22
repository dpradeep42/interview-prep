// UI test: all views at 390 and 1280, open every card, mock flow, keyboard; screenshots
import puppeteer from 'puppeteer-core';
const URL0 = process.argv.slice(2).find(a => /^http/.test(a)) || 'http://localhost:8765/';
const FULL = process.argv.includes('--full'), SHOTS = process.argv.includes('--shots');
const b = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
const errs = []; let fail = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function check(ok, msg) { if (!ok) fail++; console.log((ok ? 'PASS ' : 'FAIL ') + msg); }
for (const W of [390, 1280]) {
  const pg = await b.newPage(); await pg.setViewport({width: W, height: W < 500 ? 844 : 900, deviceScaleFactor: SHOTS && W < 500 ? 2 : 1, isMobile: W < 500, hasTouch: W < 500});
  pg.on('pageerror', e => errs.push(W + ' ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(W + ' ' + m.text()); });
  await pg.evaluateOnNewDocument(() => localStorage.clear());
  await pg.goto(URL0, {waitUntil: 'networkidle0'}); await pg.waitForFunction(() => window.__QA);
  const n0 = await pg.evaluate(() => document.querySelectorAll('#list details.card').length);
  check(n0 === 982, W + ' list tab shows ' + n0 + ' list items');
  check(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), W + ' no horizontal page scroll');
  // all cards: open every bank card in All tab
  await pg.evaluate(() => document.querySelector('#tabs .chip[data-k="all"]').click());
  const r = await pg.evaluate(async (FULL) => {
    const ds = [...document.querySelectorAll('#list details.card[data-id]')];
    const pick = FULL ? ds : ds.filter((d, i) => i % 7 === 0);
    pick.forEach(d => d.open = true);
    await new Promise(r => setTimeout(r, 1500));
    for (let i = 0; i < 40; i++) { if (!document.querySelector('.mermaid-box[data-code]') && !document.querySelector('.body:not([data-done])') && ![...document.querySelectorAll('.mermaid-box')].some(b => !b.querySelector('svg,pre'))) break; await new Promise(r => setTimeout(r, 500)); }
    const opened = pick.length;
    return {cards: ds.length, opened, say: document.querySelectorAll('#list .say').length, sayText: [...document.querySelectorAll('#list .say p')].filter(p => p.textContent.trim().length > 30).length, rate: document.querySelectorAll('#list .rate').length, more: document.querySelectorAll('#list details.more').length, moreOpen: document.querySelectorAll('#list details.more[open]').length, boxes: document.querySelectorAll('.mermaid-box').length, svgs: document.querySelectorAll('.mermaid-box svg').length, fallback: document.querySelectorAll('.mermaid-box pre').length, overflow: document.documentElement.scrollWidth > innerWidth + 1};
  }, FULL);
  check(r.cards === 670, W + ' All tab has ' + r.cards + ' cards');
  check(r.say === r.opened && r.rate === r.opened && r.more === r.opened && r.moreOpen === 0, W + ' opened ' + r.opened + ': say ' + r.say + ', rate ' + r.rate + ', more ' + r.more + ' (open ' + r.moreOpen + ')');
  check(r.svgs === r.boxes && r.fallback === 0, W + ' diagrams drawn ' + r.svgs + '/' + r.boxes + ', fallbacks ' + r.fallback);
  check(!r.overflow, W + ' no horizontal scroll with cards open');
  await pg.evaluate(() => document.querySelector('#collapse').click());
  // search + suggestions
  await pg.evaluate(() => document.querySelector('#tabs .chip[data-k="list"]').click());
  await pg.focus('#search'); await pg.type('#search', 'custom middleware', {delay: 10}); await sleep(500);
  const s = await pg.evaluate(() => ({sugg: document.querySelectorAll('#sugg:not(.hidden) .si').length, first: document.querySelector('#list details.card').getAttribute('data-id')}));
  check(s.sugg > 0 && s.first === 'p10-2', W + ' search custom middleware: ' + s.sugg + ' suggestions, first card ' + s.first);
  if (SHOTS && W === 390) await pg.screenshot({path: '/workspace/shot-search-390.png'});
  await pg.keyboard.press('Enter'); await sleep(900);
  const o = await pg.evaluate(() => { const d = document.querySelector('#list details.card[open]'); return d && d.getAttribute('data-id'); });
  check(o === 'p10-2', W + ' Enter opens the best card: ' + o);
  if (SHOTS && W === 390) await pg.screenshot({path: '/workspace/shot-card-390.png'});
  // rate from card
  await pg.evaluate(() => document.querySelector('#list details.card[open] .rate button.s').click());
  check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ip.r'))['p10-2'] === 's'), W + ' rating saved to localStorage');
  // weak filter
  await pg.evaluate(() => { const s = document.querySelector('#search'); s.value = ''; s.dispatchEvent(new Event('input')); });
  await sleep(300);
  await pg.evaluate(() => { document.querySelector('#tabs .chip[data-k="all"]').click(); const st = document.querySelector('#status'); st.value = 'weak'; st.dispatchEvent(new Event('change')); });
  const wk = await pg.evaluate(() => [...document.querySelectorAll('#list details.card')].map(d => d.getAttribute('data-id')));
  check(wk.length === 1 && wk[0] === 'p10-2', W + ' "Revise weak ones" filter shows ' + wk.join(','));
  await pg.evaluate(() => { const st = document.querySelector('#status'); st.value = 'all'; st.dispatchEvent(new Event('change')); });
  // views
  for (const v of ['top', 'revise', 'kit']) {
    await pg.evaluate(v => document.querySelector('#nav button[data-v="' + v + '"]').click(), v); await sleep(300);
    const t = await pg.evaluate(v => ({len: document.querySelector('#view-' + v).innerText.length, cards: document.querySelectorAll('#view-' + v + ' details.card').length, vis: !document.querySelector('#view-' + v).classList.contains('hidden'), ov: document.documentElement.scrollWidth > innerWidth + 1}), v);
    check(t.vis && t.len > 500 && !t.ov, W + ' view ' + v + ' renders (' + t.len + ' chars, ' + t.cards + ' cards)');
    if (SHOTS && W === 390 && v === 'kit') await pg.screenshot({path: '/workspace/shot-kit-390.png'});
  }
  // mock flow
  await pg.evaluate(() => document.querySelector('#nav button[data-v="mock"]').click()); await sleep(200);
  await pg.select('#mcount', '5'); await pg.select('#msrc', 'top');
  await pg.click('#mstart'); await sleep(300);
  let q1 = await pg.evaluate(() => document.querySelector('#mq').textContent);
  const noAns = await pg.evaluate(() => !document.querySelector('#mans .say'));
  check(!!q1 && noAns, W + ' mock shows only the question: ' + q1.slice(0, 50));
  if (SHOTS && W === 390) await pg.screenshot({path: '/workspace/shot-mock-q-390.png'});
  await pg.keyboard.press('Space'); await sleep(200);
  check(await pg.evaluate(() => !!document.querySelector('#mans .say')), W + ' Space reveals the answer');
  if (SHOTS && W === 390) await pg.screenshot({path: '/workspace/shot-mock-a-390.png'});
  await pg.keyboard.press('1'); await sleep(500);
  const q2 = await pg.evaluate(() => document.querySelector('#mq') && document.querySelector('#mq').textContent);
  check(q2 && q2 !== q1, W + ' rating 1 moves to next question');
  // swipe on phone
  if (W < 500) {
    const box = await pg.evaluate(() => { const r = document.querySelector('#stage').getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + 120}; });
    await pg.touchscreen.touchStart(box.x + 100, box.y); await pg.touchscreen.touchMove(box.x - 100, box.y); await pg.touchscreen.touchEnd(); await sleep(200);
    check(await pg.evaluate(() => !!document.querySelector('#mans .say')), W + ' swipe left reveals');
  } else { await pg.keyboard.press('ArrowRight'); await sleep(100); }
  await pg.keyboard.press('2'); await sleep(450); await pg.keyboard.press('Space'); await pg.keyboard.press('3'); await sleep(450);
  await pg.keyboard.press('Escape'); await sleep(200);
  const sum = await pg.evaluate(() => document.querySelector('#msum') && document.querySelector('#msum').innerText.slice(0, 80));
  check(!!sum, W + ' Esc ends with summary: ' + (sum || '').replace(/\s+/g, ' '));
  const hist = await pg.evaluate(() => JSON.parse(localStorage.getItem('ip.mh') || '[]'));
  check(hist.length === 1 && hist[0].g === 1 && hist[0].s === 1 && hist[0].m === 1, W + ' mock history saved ' + JSON.stringify(hist[0]));
  await pg.close();
}
console.log('FAIL', fail, 'JS ERRORS', errs.length, errs.slice(0, 5));
await b.close(); process.exit(fail || errs.length ? 1 : 0);
