import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const pg=await b.newPage(); await pg.setViewport({width:390,height:844});
await pg.goto('file://'+process.cwd()+'/../index.html',{waitUntil:'networkidle0'});
for (const tab of ['list','all','p10','p1']) {
  await pg.evaluate(t=>{document.querySelector('.tab[data-k="'+t+'"]').click();},tab);
  await pg.evaluate(q=>{const s=document.getElementById('search'); s.value=q; s.dispatchEvent(new Event('input'));}, process.argv[2]||'custom middleware');
  const r=await pg.evaluate(()=>({c:document.getElementById('count').textContent, t:[...document.querySelectorAll('#list h2, #list summary .q')].slice(0,8).map(e=>e.textContent)}));
  console.log(tab, r.c); r.t.forEach(x=>console.log('   ',x));
}
await b.close();
