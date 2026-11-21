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
console.log(file, await pg.evaluate(()=>JSON.stringify(window.__QA)), 'mermaid loaded:', await pg.evaluate(()=>typeof mermaid));
// All tab, expand all
await pg.click('button.tab[data-k="all"]');
const n = await pg.$$eval('#list details', d=>d.length);
await pg.click('#expand');
await new Promise(r=>setTimeout(r,8000));
const res = await pg.evaluate(()=>({boxes: document.querySelectorAll('.mermaid-box').length, svgs: document.querySelectorAll('.mermaid-box svg').length, fallbacks: document.querySelectorAll('.mermaid-box pre').length, tables: document.querySelectorAll('.vis table').length, steps: document.querySelectorAll('ol.steps').length, fus: document.querySelectorAll('.fu').length, brackets: (document.body.innerText.match(/\[[^\]]+\]/g)||[]).length}));
console.log(file, 'details', n, res);
await pg.type('#search','publisher confirms'); await new Promise(r=>setTimeout(r,300));
console.log('search count:', await pg.$eval('#count', e=>e.textContent));
if (file==='index.html') { await pg.evaluate(()=>{document.querySelector('#search').value='';document.querySelector('#search').dispatchEvent(new Event('input'));}); await pg.click('button.tab[data-k="p3"]'); await pg.click('#stories'); console.log('p3 stories:', await pg.$eval('#count', e=>e.textContent));
 await pg.click('#stories'); await pg.click('button.tab[data-k="p2"]'); await pg.click('#pics'); await pg.click('#expand'); await new Promise(r=>setTimeout(r,4000)); await pg.screenshot({path:'shot-p2.png', fullPage:false}); }
else { await pg.setViewport({width:390,height:844}); await pg.evaluate(()=>{document.querySelector('#search').value='middleware';document.querySelector('#search').dispatchEvent(new Event('input'));}); await pg.click('#expand'); await new Promise(r=>setTimeout(r,3000)); await pg.screenshot({path:'shot-mobile-dark.png'}); }
}
console.log('ERRORS', errs.length, errs.slice(0,10)); console.log('WARN', warns.slice(0,5));
await b.close();
