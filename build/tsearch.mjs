// Search regression: realistic candidate searches; expected best answer must be #1
import puppeteer from 'puppeteer-core';
const URL0 = process.argv[2] || 'http://localhost:8765/';
const CASES = [
 ['custom middleware', ['p10-2']], ['middleware', ['p10-1']], ['what is middleware', ['p10-1']], ['middleware vs filter', ['p1-21']], ['filters vs middleware', ['p1-21']],
 ['DI lifetimes', ['p1-18']], ['scoped vs transient', ['p1-18']], ['dependency injection', ['p4-50']], ['async await', ['p1-3']], ['deadlock', ['p4-36', 'p1-50']],
 ['IEnumerable vs IQueryable', ['p1-5']], ['jwt refresh token', ['p4-91']], ['jwt', ['p2-46']], ['kafka partition', ['p2-38']], ['kafka', ['p6-33', 'p2-37']],
 ['rabbitmq dlq', ['p2-43']], ['sql index', ['p1-44']], ['deadlock sql', ['p1-50']], ['ef core tracking', ['p1-33']], ['ef core', ['p5-1']], ['n+1', ['p1-34']],
 ['docker vs vm', ['p6-6']], ['k8s pod', ['p2-18']], ['ci cd pipeline', ['p2-25', 'p2-24']], ['solid', ['p1-7']], ['singleton pattern', ['p1-8']], ['react hooks', ['p1-66']],
 ['tell me about yourself', ['p3-1']], ['why leave', ['p3-57']], ['mcp server', ['p3-8']], ['what is mcp', ['p2-54']], ['gxp', ['p7-49']], ['sftp', ['p7-34']],
 ['outbox', ['p2-44']], ['cors', ['p1-29']], ['salary', ['p3-60']], ['strengths', ['p3-55']], ['weakness', ['p3-56']], ['clustered index', ['p1-44']], ['idempotent consumer', ['p2-42']]
];
const b = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(URL0, {waitUntil: 'networkidle0'});
await pg.waitForFunction(() => window.__QA);
let fail = 0;
for (const [q, exp] of CASES) {
  const r = await pg.evaluate(q => window.__QA.search(q).slice(0, 4), q);
  const ok = r.length && exp.includes(r[0].id);
  if (!ok) fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + q.padEnd(26) + ' #1 ' + (r[0] ? r[0].id + ' ' + r[0].q + ' (' + r[0].s + ')' : '-') + (ok ? '' : '\n      expected ' + exp.join('|') + ' | got ' + r.map(x => x.id + ':' + x.s).join(', ')));
}
// completeness: every question whose title contains the term must be in the strong results
for (const term of ['middleware', 'filters', 'DI', 'dependency injection', 'jwt', 'kafka', 'ef core', 'custom middleware', 'rabbitmq', 'sftp']) {
  const r = await pg.evaluate(t => { const res = window.__QA.search(t); const strong = new Set(res.filter(x => x.s >= 600).map(x => x.id)); const n = s => (' ' + s.toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' '); const tt = n(t).trim(); const stem = tt.replace(/s$/, '');
    const want = window.__QA.titles().filter(c => n(c.q).includes(' ' + tt + ' ') || n(c.q).includes(' ' + stem + ' ')); return {want: want.length, missing: want.filter(c => !strong.has(c.id) && !c.dup).map(c => c.id + ' ' + c.q), strong: strong.size}; }, term);
  if (r.missing.length) fail++;
  console.log((r.missing.length ? 'FAIL ' : 'PASS ') + ('all titles with "' + term + '"').padEnd(40) + r.want + ' in titles, ' + r.strong + ' strong matches' + (r.missing.length ? ' MISSING ' + r.missing.join(' | ') : ''));
}
// UI check: type into the search box; the first result link must be the expected answer, and tapping it opens that answer
for (const [q, exp] of [['custom middleware', 'p10-2'], ['middleware vs filter', 'p1-21'], ['jwt refresh token', 'p4-91']]) {
  await pg.goto(URL0, {waitUntil: 'networkidle0'}); await pg.waitForFunction(() => window.__QA);
  await pg.focus('#q'); await pg.type('#q', q, {delay: 5}); await new Promise(r => setTimeout(r, 200));
  const first = await pg.evaluate(() => (document.querySelector('#res a') || {}).dataset?.id);
  await pg.click('#res a'); await pg.waitForFunction(() => !document.querySelector('#answer').hidden && document.querySelectorAll('#abody p').length > 1);
  const opened = await pg.evaluate(() => document.querySelector('#aq').textContent);
  const titles = await pg.evaluate(() => window.__QA.titles());
  const ok = first === exp && opened === titles.find(t => t.id === exp).q;
  if (!ok) fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + 'UI "' + q + '" first result ' + first + ' -> opened "' + opened + '"');
}
// the custom middleware answer must also explain what middleware itself is
{
  const a = await pg.evaluate(() => window.__QA.answer('p10-2'));
  const t = a.s.join(' ');
  const ok = /request pipeline|pipeline of components called middleware/i.test(t) && /calling next|call(s|ing)? next/i.test(t) && /reverse order/i.test(t) && /InvokeAsync/.test(t);
  if (!ok) fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + 'custom middleware answer explains middleware + pipeline first: "' + t.slice(0, 90) + '..."');
}
console.log('FAIL', fail, 'of', CASES.length + 14, 'JS ERRORS', errs.length, errs.slice(0, 3));
await b.close(); process.exit(fail || errs.length ? 1 : 0);
