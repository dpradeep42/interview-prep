// search regression: every question whose title contains the term must be present, on every tab
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'file:///workspace/interview-prep/index.html';
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', args:['--no-sandbox']});
const errs=[]; const pg = await b.newPage();
pg.on('pageerror', e=>errs.push(e.message));
await pg.setViewport({width:390,height:844,isMobile:true});
await pg.goto(url, {waitUntil:'networkidle0'});
const TERMS = ['middleware','filters','DI','dependency injection','jwt','kafka','ef core'];
let fail = 0;
for (const term of TERMS) {
  for (const tab of ['list','all','p1']) {
    await pg.click(`button.tab[data-k="${tab}"]`);
    await pg.evaluate(t=>{const s=document.getElementById('search'); s.value=t; s.dispatchEvent(new Event('input'));}, term);
    await new Promise(r=>setTimeout(r,250));
    const r = await pg.evaluate((term, tab)=>{
      const D = JSON.parse(document.getElementById('data').textContent);
      const nrm = t => (' ' + String(t).toLowerCase().replace(/c#/g,' csharp ').replace(/[^a-z0-9\u00c0-\uffff]+/g,' ') + ' ').replace(/\s+/g,' ');
      const T = nrm(term).trim(), has = t => T.length < 3 ? nrm(t).includes(' '+T+' ') : nrm(t).includes(T);
      const shownQ = new Set([...document.querySelectorAll('#list details[data-id]')].map(d=>d.dataset.id));
      const shownL = new Set([...document.querySelectorAll('#list details[data-lid]')].map(d=>d.dataset.lid));
      const covered = new Set(shownQ); D.LIST.forEach(s=>s.items.forEach(it=>{ if (shownL.has(it.id)) it.refs.forEach(r=>covered.add(r)); }));
      const missing = [];
      for (const p of ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10']) {
        if (tab!=='list' && tab!=='all' && p!==tab) continue;
        D[p].QS.forEach((q,i)=>{ if (has(q[2]) && !covered.has(p+'-'+(i+1))) missing.push(p+'-'+(i+1)+' '+q[2]); });
      }
      if (tab==='list') D.LIST.forEach(s=>s.items.forEach(it=>{ if (has(it.text) && !shownL.has(it.id)) missing.push('#'+it.id+' '+it.text); }));
      const top = [...document.querySelectorAll('#list details > summary .q')].slice(0,5).map(e=>e.textContent);
      return {n: shownQ.size + shownL.size, missing, top, count: document.getElementById('count').textContent};
    }, term, tab);
    if (r.missing.length) fail++;
    console.log(JSON.stringify(term).padEnd(22), tab.padEnd(4), String(r.n).padStart(3), r.missing.length ? 'MISSING ' + r.missing.join(' ; ') : 'ok', '|', r.top.slice(0,3).join(' || '));
  }
}
// specific: middleware must include Filters vs middleware on default (list) tab
await pg.click('button.tab[data-k="list"]');
await pg.evaluate(()=>{const s=document.getElementById('search'); s.value='middleware'; s.dispatchEvent(new Event('input'));});
await new Promise(r=>setTimeout(r,250));
const fv = await pg.evaluate(()=>[...document.querySelectorAll('#list summary .q')].some(e=>/Filters vs middleware/.test(e.textContent)));
console.log('list tab middleware includes "Filters vs middleware?":', fv); if (!fv) fail++;
console.log('FAIL', fail, 'JS ERRORS', errs.length, JSON.stringify(errs.slice(0,3)));
await b.close();
process.exit(fail || errs.length ? 1 : 0);
