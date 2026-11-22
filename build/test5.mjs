import puppeteer from 'puppeteer-core';
const url = process.argv[2], W = +(process.argv[3]||390);
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', args:['--no-sandbox']});
const errs=[]; const pg = await b.newPage();
pg.on('pageerror', e=>errs.push(e.message)); pg.on('console', m=>{ if (m.type()==='error') errs.push('console: '+m.text()); });
await pg.setViewport({width:W,height:844,isMobile:W<500});
await pg.goto(url, {waitUntil:'networkidle0'});
const hasT = await pg.$('#inans') !== null;
async function q(tab, term, inans){
  await pg.click(`button.tab[data-k="${tab}"]`);
  if (hasT) await pg.evaluate(v=>{const c=document.getElementById('inans'); if (c.checked!==v) c.click();}, inans);
  await pg.evaluate(t=>{const s=document.getElementById('search'); s.value=t; s.dispatchEvent(new Event('input'));}, term);
  await new Promise(r=>setTimeout(r,300));
  return pg.evaluate(()=>({count:document.getElementById('count').textContent, n:document.querySelectorAll('#list details[data-id], #list details[data-lid]').length, top:[...document.querySelectorAll('#list details[data-id] > summary .q, #list details[data-lid] > summary .q')].slice(0,6).map(e=>e.textContent)}));
}
for (const tab of ['list','all','p10','p1']) for (const ia of hasT?[false,true]:[false]) { const r = await q(tab,'middleware',ia); console.log(tab, 'answers='+ia, r.n, '|', r.count); console.log('   ', r.top.join(' || ')); }
if (hasT) {
  for (const [tab,t] of [['all','Custom Middleware'],['all','asp.net core'],['all','JWT'],['list','512'],['list','#131'],['all','c#'],['all','C++'],['all','ef'],['all','.NET 8'],['all','zzzz']]) { const r=await q(tab,t,false); console.log(tab, JSON.stringify(t), r.n, '|', r.top.slice(0,3).join(' || ')); }
  // open first result body works
  await q('all','middleware',false);
  await pg.evaluate(()=>{const d=document.querySelector('#list details[data-id]'); d.open=true;});
  await new Promise(r=>setTimeout(r,2500));
  console.log('body ok', await pg.evaluate(()=>!!document.querySelector('#list details[data-id] .quick')), 'overflowX', await pg.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1));
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.screenshot({path:'shot-search-'+W+'.png'});
  await pg.evaluate(t=>{const s=document.getElementById('search'); s.value=''; s.dispatchEvent(new Event('input'));});
  await pg.click('button.tab[data-k="list"]'); console.log('cleared list', await pg.$eval('#count',e=>e.textContent));
}
console.log('ERRORS', errs.length, errs.slice(0,5)); await b.close();
