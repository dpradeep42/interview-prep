// UI test for the minimal site: 390 px and 1280 px. 0 JS errors, every answer renders, no extra controls, list-item coverage, screenshots.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const URL0 = process.argv[2] || 'http://localhost:8765/';
const SHOTS = process.argv[3] || '/workspace';
const b = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
let fail = 0; const log = (ok, m) => { if (!ok) fail++; console.log((ok ? 'PASS ' : 'FAIL ') + m); };
for (const [w, h, mobile] of [[390, 844, true], [1280, 900, false]]) {
  const pg = await b.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('requestfailed', r => { if (!/jsdelivr/.test(r.url())) errs.push('requestfailed ' + r.url()); });
  await pg.setViewport({width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1});
  await pg.goto(URL0, {waitUntil: 'networkidle0'}); await pg.waitForFunction(() => window.__QA);
  // home view: only the box, the hint and the ordered list of every question (your list's sections first), no buttons
  const sv = await pg.evaluate(() => ({buttons: document.querySelectorAll('button,select,textarea,input:not(#q)').length, inputs: document.querySelectorAll('input').length,
    links: document.querySelectorAll('#res a').length, secs: [...document.querySelectorAll('#res li.sec')].map(l => l.textContent), first: (document.querySelector('#res a') || {}).textContent,
    ids: [...document.querySelectorAll('#res a')].map(a => a.dataset.id), hint: document.querySelector('#hint').textContent}));
  const nCanon = await pg.evaluate(() => window.__QA.cards);
  log(sv.buttons === 0 && sv.inputs === 1 && sv.links === nCanon && new Set(sv.ids).size === nCanon && /^1\. Resume/.test(sv.secs[0]) && /Tell me about yourself/.test(sv.first),
    w + 'px home (empty search): ' + sv.links + '/' + nCanon + ' questions listed once each, ' + sv.secs.length + ' section labels, first "' + sv.first + '", 0 buttons');
  log(sv.secs.some(x => /Angular/.test(x)) && sv.secs.some(x => /IRT/.test(x)) && sv.secs.some(x => /Azure/.test(x)), w + 'px home has Angular, IRT and Azure/AWS sections');
  if (mobile) { await pg.screenshot({path: SHOTS + '/shot-home-390.png'}); await pg.evaluate(() => [...document.querySelectorAll('#res li.sec')].find(l => /IRT: clinical/.test(l.textContent)).scrollIntoView()); await pg.screenshot({path: SHOTS + '/shot-home-irt-390.png'}); await pg.evaluate(() => window.scrollTo(0, 0)); }
  // tapping a home question opens it; back returns to the home list
  await pg.evaluate(() => [...document.querySelectorAll('#res a')].find(a => a.dataset.id === 'p13-10').scrollIntoView({block: 'center'}));
  await pg.click('#res a[data-id="p13-10"]'); await pg.waitForFunction(() => !document.querySelector('#answer').hidden && document.querySelectorAll('#abody p').length > 1);
  const hq = await pg.evaluate(() => document.querySelector('#aq').textContent);
  await pg.goBack(); await pg.waitForFunction(() => !document.querySelector('#search').hidden);
  await new Promise(r => setTimeout(r, 300));
  const hb = await pg.evaluate(() => ({links: document.querySelectorAll('#res a').length, y: window.scrollY}));
  log(/randomisation work in IRT/.test(hq) && hb.links === nCanon && hb.y > 200, w + 'px home tap -> "' + hq + '" -> back to home list (' + hb.links + ' links, scroll kept at ' + Math.round(hb.y) + ')');
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.type('#q', 'middleware', {delay: 10}); await new Promise(r => setTimeout(r, 200));
  const rs = await pg.evaluate(() => [...document.querySelectorAll('#res a')].map(a => a.textContent));
  log(rs.length >= 5 && /middleware/i.test(rs[0]), w + 'px typing "middleware": ' + rs.length + ' results, #1 "' + rs[0] + '"');
  if (mobile) await pg.screenshot({path: SHOTS + '/shot-search-390.png'}); else await pg.screenshot({path: SHOTS + '/shot-search-1280.png'});
  await pg.evaluate(() => { const s = document.querySelector('#q'); s.value = ''; s.dispatchEvent(new Event('input')); });
  const cl = await pg.evaluate(() => ({links: document.querySelectorAll('#res a').length, home: document.querySelector('#res').classList.contains('home')}));
  log(cl.home && cl.links === nCanon, w + 'px clearing the box brings the home list back (' + cl.links + ' questions)');
  await pg.type('#q', 'custom middleware', {delay: 10}); await new Promise(r => setTimeout(r, 200));
  await pg.click('#res a'); await pg.waitForFunction(() => !document.querySelector('#answer').hidden && document.querySelectorAll('#abody p').length > 1);
  const av = await pg.evaluate(() => ({hash: location.hash, q: document.querySelector('#aq').textContent, controls: [...document.querySelectorAll('button,select,textarea,a,input')].filter(e => e.offsetParent).map(e => e.id || e.tagName)}));
  const sh = await pg.evaluate(() => { const sp = [...document.querySelectorAll('#abody .also, #abody .also-p')]; const first = document.querySelector('#abody p'); const cs = sp[0] && getComputedStyle(sp[0]); return {n: sp.length, introShaded: !!(first && (first.classList.contains('also-p') || first.querySelector('.also')) && /pipeline of components called middleware/.test((first.classList.contains('also-p') ? first : first.querySelector('.also')).textContent)), bg: cs && cs.backgroundColor}; });
  log(sh.n > 0 && sh.introShaded && sh.bg && sh.bg !== 'rgba(0, 0, 0, 0)', w + 'px custom middleware answer: middleware intro shaded (' + sh.n + ' shaded passages, tint ' + sh.bg + ')');
  log(/^#q\//.test(av.hash) && av.controls.length === 1 && av.controls[0] === 'back', w + 'px answer view ' + av.hash + ': visible controls ' + JSON.stringify(av.controls));
  await new Promise(r => setTimeout(r, 1500));
  if (mobile) { await pg.screenshot({path: SHOTS + '/shot-answer-390.png'}); await pg.screenshot({path: SHOTS + '/shot-answer-390-full.png', fullPage: true}); } else await pg.screenshot({path: SHOTS + '/shot-answer-1280.png'});
  // browser back returns to the search with the query kept
  await pg.goBack(); await pg.waitForFunction(() => !document.querySelector('#search').hidden);
  const bk = await pg.evaluate(() => ({q: document.querySelector('#q').value, n: document.querySelectorAll('#res li').length}));
  log(bk.q === 'custom middleware' && bk.n > 0, w + 'px browser back -> search with query kept ("' + bk.q + '", ' + bk.n + ' results)');
  // back arrow + swipe
  await pg.click('#res a'); await pg.waitForFunction(() => !document.querySelector('#answer').hidden);
  await pg.click('#back'); await pg.waitForFunction(() => !document.querySelector('#search').hidden);
  log(true, w + 'px back arrow -> search');
  if (mobile) {
    await pg.click('#res a'); await pg.waitForFunction(() => !document.querySelector('#answer').hidden && document.querySelectorAll('#abody p').length > 1);
    await pg.evaluate(() => { const el = document.querySelector('#answer'); const mk = (t, x) => new TouchEvent(t, {bubbles: true, touches: t === 'touchend' ? [] : [new Touch({identifier: 1, target: el, clientX: x, clientY: 300})], changedTouches: [new Touch({identifier: 1, target: el, clientX: x, clientY: 300})]}); el.dispatchEvent(mk('touchstart', 20)); el.dispatchEvent(mk('touchend', 220)); });
    await pg.waitForFunction(() => !document.querySelector('#search').hidden, {timeout: 3000}).then(() => log(true, '390px swipe right -> search'), () => log(false, '390px swipe right did not go back'));
  }
  // every answer renders via its deep link
  const all = await pg.evaluate(() => window.__QA.titles().filter(t => !t.dup));
  let bad = [], words = [];
  for (const t of all) {
    await pg.evaluate(sl => { location.hash = '#q/' + sl; }, t.sl);
    const r = await pg.waitForFunction(id => { const p = document.querySelectorAll('#abody p'); return !document.querySelector('#answer').hidden && p.length > 1 && !document.querySelector('#abody .wait') && document.querySelector('#aq').textContent; }, {timeout: 5000}, t.id).then(() => pg.evaluate(q => {
      const txt = document.querySelector('#abody').innerText; return {ok: document.querySelector('#aq').textContent === q, br: /[\[\]]/.test([...document.querySelectorAll('#abody p')].map(p => p.textContent).join(' ')), w: txt.split(/\s+/).length, offer: /\bI can (explain|show|walk you|talk about)\b/.test(txt)};
    }, t.q), () => ({ok: false}));
    if (!r.ok || r.br || r.offer) bad.push(t.id + (r.br ? ' bracket' : '') + (r.offer ? ' offer' : ''));
    words.push(r.w || 0);
  }
  log(!bad.length, w + 'px all ' + all.length + ' answers render from #q/slug deep links' + (bad.length ? ' BAD ' + bad.slice(0, 10).join(', ') : ''));
  // dup deep link goes to the canonical answer
  const dups = await pg.evaluate(() => window.__QA.titles().filter(t => t.dup));
  for (const d of dups) { await pg.evaluate(sl => { location.hash = '#q/' + sl; }, d.sl); await new Promise(r => setTimeout(r, 150)); const q = await pg.evaluate(() => document.querySelector('#aq').textContent); const exp = all.find(x => x.id === d.dup).q; log(q === exp, w + 'px duplicate ' + d.id + ' deep link opens ' + d.dup); }
  // diagrams render (pick a few with pictures)
  const withVis = await pg.evaluate(async () => { const out = []; for (const t of window.__QA.titles()) { if (t.dup) continue; const a = await window.__QA.answer(t.id); if (a && a.v) out.push(t.sl); } return out; });
  let svgOk = 0;
  for (const sl of withVis.slice(0, 6)) { await pg.evaluate(s => { location.hash = '#q/' + s; }, sl); await pg.waitForFunction(() => document.querySelector('#abody .vis svg') || !document.querySelector('#abody .vis'), {timeout: 15000}).catch(() => {}); if (await pg.evaluate(() => !!document.querySelector('#abody .vis svg'))) svgOk++; }
  log(svgOk >= 5, w + 'px diagrams: ' + withVis.length + ' answers have one; ' + svgOk + '/6 sampled rendered as SVG');
  log(errs.length === 0, w + 'px JS errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  await pg.close();
}
// coverage: every list item is searchable and finds its answer
{
  const pg = await b.newPage(); await pg.goto(URL0, {waitUntil: 'networkidle0'}); await pg.waitForFunction(() => window.__QA);
  const M = JSON.parse(fs.readFileSync(new URL('./itemmap.json', import.meta.url)));
  const miss = await pg.evaluate(M => M.filter(([id, text, refs]) => { const r = window.__QA.search(text).slice(0, 10).map(x => x.id); return !refs.some(x => r.includes(x)); }).map(([id, text, refs]) => id + ' "' + text.slice(0, 60) + '" -> ' + refs.join('|')), M);
  log(!miss.length, 'all ' + M.length + ' list items: searching the item text finds its answer in the top 10' + (miss.length ? ' (' + miss.length + ' missing) ' + miss.slice(0, 8).join(' || ') : ''));
  const t1 = await pg.evaluate(M => M.filter(([id, text, refs]) => refs.includes((window.__QA.search(text)[0] || {}).id)).length, M);
  console.log('INFO list items whose answer is #1: ' + t1 + '/' + M.length);
  await pg.close();
}
console.log('FAILS', fail);
await b.close(); process.exit(fail ? 1 : 0);
