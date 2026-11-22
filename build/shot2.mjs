import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', args:['--no-sandbox']});
const pg = await b.newPage(); await pg.setViewport({width:390,height:844,isMobile:true});
await pg.goto('file:///workspace/interview-prep/index.html',{waitUntil:'networkidle0'});
await pg.click('button.tab[data-k="all"]');
await pg.evaluate(()=>{const s=document.getElementById('search'); s.value='middleware'; s.dispatchEvent(new Event('input'));});
await new Promise(r=>setTimeout(r,300));
await pg.evaluate(()=>document.querySelector('.controls').scrollIntoView());
await pg.screenshot({path:'shot-search3.png'}); await b.close();
