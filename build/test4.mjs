import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', args:['--no-sandbox']});
const errs=[];
for (const [w,h,mob,file] of [[390,844,true,'index.html'],[1280,900,false,'interview-prep.html']]) {
  const pg = await b.newPage();
  pg.on('pageerror', e=>errs.push(w+': '+e.message)); pg.on('console', m=>{ if (m.type()==='error') errs.push(w+' console: '+m.text()); });
  await pg.setViewport({width:w,height:h,isMobile:mob});
  const t0=Date.now();
  await pg.goto('file:///workspace/interview-prep/'+file, {waitUntil:'networkidle0'});
  console.log(w,'load ms', Date.now()-t0, await pg.evaluate(()=>JSON.stringify(__QA)));
  console.log(' bodies before open:', await pg.evaluate(()=>document.querySelectorAll('.quick').length));
  await pg.click('button.tab[data-k="all"]');
  const n = await pg.$$eval('#all details[data-id], details[data-id]', d=>d.length);
  await pg.click('#expand'); await new Promise(r=>setTimeout(r,45000));
  const r = await pg.evaluate(()=>({open:document.querySelectorAll('details[data-id][open]').length, quick:document.querySelectorAll('.quick').length, imp:document.querySelectorAll('details.impress').length, code:document.querySelectorAll('.code').length, copy:[...document.querySelectorAll('button')].filter(x=>/copy/i.test(x.textContent)).length, fu:document.querySelectorAll('.fu').length, boxes:document.querySelectorAll('.mermaid-box').length, svgs:document.querySelectorAll('.mermaid-box svg').length, fallbacks:document.querySelectorAll('.mermaid-box pre').length, overflowX: document.documentElement.scrollWidth > window.innerWidth+1}));
  console.log(w,'ALL details',n,r);
  await pg.evaluate(()=>{ const d=document.querySelector('details[data-id="p4-69"] details.impress')||document.querySelectorAll('details.impress')[300]; d.open=true; d.scrollIntoView(); });
  await new Promise(r=>setTimeout(r,800)); await pg.screenshot({path:`shot-final-${w}.png`});
  await pg.click('button.tab[data-k="list"]');
  console.log(w,'list count', await pg.$eval('#count', e=>e.textContent));
  await pg.type('#search','middleware'); await new Promise(r=>setTimeout(r,400));
  console.log(w,'search middleware', await pg.$eval('#count', e=>e.textContent));
  await pg.close();
}
console.log('ERRORS', errs.length, errs.slice(0,10));
await b.close();
