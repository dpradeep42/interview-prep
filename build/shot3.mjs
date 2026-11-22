import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const pg=await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:2});
await pg.goto('file://'+process.cwd()+'/../index.html',{waitUntil:'networkidle0'});
await pg.evaluate(()=>{const t=[...document.querySelectorAll('button,[role=tab],.tab')].find(x=>/part 10/i.test(x.textContent)); t&&t.click();});
await new Promise(r=>setTimeout(r,500));
await pg.evaluate(()=>{const d=document.querySelector('details[data-id="p10-1"]'); d.open=true; d.scrollIntoView();});
await new Promise(r=>setTimeout(r,1500));
await pg.screenshot({path:'/workspace/say-phone.png'}); await b.close();
