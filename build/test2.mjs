import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', args:['--no-sandbox']});
const errs=[]; const warns=[];
for (const [file, scheme] of [['index.html','light'],['interview-prep.html','dark']]) {
const pg = await b.newPage();
await pg.emulateMediaFeatures([{name:'prefers-color-scheme', value:scheme}]);
pg.on('pageerror', e=>errs.push(file+': '+e.message));
pg.on('console', m=>{ if (m.type()==='error') errs.push(file+' console: '+m.text()); if (m.type()==='warning') warns.push(m.text().slice(0,200)); });
await pg.setViewport({width:1200,height:900});
await pg.goto('file:///workspace/interview-prep/'+file, {waitUntil:'networkidle0'});
const qa = await pg.evaluate(()=>({total:__QA.total,pics:__QA.pics,stories:__QA.stories,list:__QA.list}));
console.log(file, JSON.stringify(qa), 'mermaid:', await pg.evaluate(()=>typeof mermaid), 'default tab:', await pg.$eval('button.tab.on', e=>e.textContent));
// Your list tab
const L = await pg.evaluate(()=>({items: document.querySelectorAll('#list details[data-lid]').length, h2: document.querySelectorAll('#list h2').length, count: document.getElementById('count').textContent, first: document.querySelector('#list h2').textContent, last: [...document.querySelectorAll('#list h2')].pop().textContent}));
console.log('LIST', L);
await pg.click('#expand'); await new Promise(r=>setTimeout(r,15000));
const LR = await pg.evaluate(()=>({open: document.querySelectorAll('#list details[open]').length, empty: [...document.querySelectorAll('#list details[data-lid]')].filter(d=>!d.querySelector('.ans .hook')).length, answers: document.querySelectorAll('#list .ans').length, svgs: document.querySelectorAll('.mermaid-box svg').length, boxes: document.querySelectorAll('.mermaid-box').length, pending: document.querySelectorAll('.mermaid-box[data-code]').length, fallbacks: document.querySelectorAll('.mermaid-box pre').length}));
console.log('LIST expanded', LR);
await pg.type('#search','512'); await new Promise(r=>setTimeout(r,300));
console.log('search 512:', await pg.$eval('#count', e=>e.textContent));
// jump
await pg.evaluate(()=>{document.querySelector('#search').value='';document.querySelector('#search').dispatchEvent(new Event('input'));});
await pg.evaluate(()=>{ const d=document.querySelector('#list details[data-lid="200"]'); d.open=true; d.querySelector('.jump').click(); });
await new Promise(r=>setTimeout(r,500));
console.log('after jump:', await pg.$eval('button.tab.on', e=>e.textContent), await pg.evaluate(()=>{const d=document.querySelector('#list details[open]'); return d && d.getAttribute('data-id');}));
// All parts expanded
await pg.click('button.tab[data-k="all"]');
const n = await pg.$$eval('#list details', d=>d.length);
await pg.click('#expand'); await new Promise(r=>setTimeout(r,20000));
const res = await pg.evaluate(()=>({boxes: document.querySelectorAll('.mermaid-box').length, svgs: document.querySelectorAll('.mermaid-box svg').length, fallbacks: document.querySelectorAll('.mermaid-box pre').length, tables: document.querySelectorAll('.vis table').length, steps: document.querySelectorAll('ol.steps').length, fus: document.querySelectorAll('.fu').length, onlist: document.querySelectorAll('.onlist').length}));
console.log(file, 'ALL details', n, res);
for (const k of ['p4','p5','p6','p7','p8','p9']) { await pg.click(`button.tab[data-k="${k}"]`); console.log(k, await pg.$eval('#count', e=>e.textContent)); }
if (file==='index.html') { await pg.click('button.tab[data-k="list"]'); await pg.evaluate(()=>{ document.querySelector('#list details[data-lid="682"]').open=true; document.querySelector('#list details[data-lid="682"]').scrollIntoView(); }); await new Promise(r=>setTimeout(r,3000)); await pg.screenshot({path:'shot-list.png'}); }
else { await pg.setViewport({width:390,height:844}); await pg.click('button.tab[data-k="list"]'); await pg.evaluate(()=>{ const d=document.querySelector('#list details[data-lid="659"]'); d.open=true; d.scrollIntoView(); }); await new Promise(r=>setTimeout(r,3000)); await pg.screenshot({path:'shot-list-mobile.png'}); }
}
console.log('ERRORS', errs.length, errs.slice(0,10)); console.log('WARN', warns.slice(0,5));
await b.close();
