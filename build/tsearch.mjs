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
 ['angular change detection', ['p11-12']], ['onpush', ['p11-12']], ['ngmodule vs standalone', ['p11-3']], ['angular lifecycle hooks', ['p11-13']], ['switchmap vs mergemap', ['p11-9']],
 ['angular signals', ['p11-19']], ['reactive forms vs template driven', ['p11-17']], ['http interceptor angular', ['p11-18']], ['angular lazy loading', ['p11-16']], ['angular route guards', ['p11-15']],
 ['behaviorsubject', ['p11-10']], ['angular pipes', ['p11-6']], ['angular directives', ['p11-5']], ['angular services dependency injection', ['p11-7']], ['observable vs promise', ['p11-8']],
 ['ngrx', ['p11-20']], ['angular vs react', ['p1-71']], ['error boundary', ['p12-4']], ['react query', ['p12-3']], ['custom hooks', ['p12-2']], ['typescript props', ['p12-1']], ['redux toolkit typescript', ['p12-10']], ['react testing library', ['p12-5']],
 ['angular to react migration', ['p13-5']], ['angular and react side by side', ['p13-3']], ['design system angular react', ['p13-4']],
 ['what is a clinical trial', ['p13-6']], ['what does a study contain', ['p13-7']], ['screening', ['p13-9']], ['re-randomisation', ['p13-12']], ['rerandomization', ['p13-12']], ['econsent', ['p13-13']], ['darm', ['p13-14']],
 ['drug accountability', ['p13-14', 'p13-26']], ['admin console', ['p13-17']], ['emergency unblinding', ['p13-15']], ['stratification', ['p13-11']], ['visit schedule', ['p13-20']], ['protocol amendment', ['p13-18']], ['irt modules', ['p13-8']],
 ['why azure and aws', ['p14-1']], ['cirt to iqvia transition', ['p14-2']], ['cenduit', ['p14-2', 'p14-1']], ['what still runs on premise', ['p14-3']], ['why mcp for on-premise azure devops', ['p14-5']],
 ['azure to aws mapping', ['p14-8']], ['variable groups vs parameter store', ['p14-9']], ['release pipelines vs codepipeline', ['p14-10']], ['tfs vs git', ['p14-11']], ['agent pools', ['p14-12']],
 ['service connection vs iam role', ['p14-13']], ['key vault vs secrets manager', ['p14-14']], ['application insights vs cloudwatch', ['p14-15']], ['service bus vs sqs', ['p14-16']], ['arm templates vs cloudformation', ['p14-17']], ['app service vs elastic beanstalk', ['p14-18']],
 ['azure to aws migration challenge', ['p14-6']],
 ['more experience on azure not aws', ['p14-19']], ['how hands-on are you with aws', ['p14-20']], ['rate yourself on aws', ['p14-21']], ['alertwatchdog', ['p14-22']], ['how did you build alertwatchdog', ['p14-23']],
 ['azure functions triggers bindings', ['p14-24']], ['durable functions', ['p14-25']], ['azure functions cold start', ['p14-26']], ['alertwatchdog on aws', ['p14-27']], ['azure functions vs lambda', ['p14-28']],
 ['timer trigger vs eventbridge', ['p14-29']], ['queue trigger vs sqs lambda', ['p14-30']], ['durable functions vs step functions', ['p14-31']], ['application insights alerts vs cloudwatch alarms', ['p14-32']], ['alertwatchdog caught issue', ['p14-33']],
 ['mcp architecture', ['p15-2']], ['mcp end to end', ['p15-1']], ['what can your mcp server do', ['p15-3']], ['register mcp tools c#', ['p15-4']], ['why dotnet for mcp', ['p15-5']], ['stdio vs streamable http', ['p15-6']],
 ['token bloat', ['p15-8']], ['polly serilog mcp', ['p15-9']], ['mcp hardest bug', ['p15-10']], ['mcp prevented bad deployment', ['p15-11']], ['mcp resources and prompts', ['p15-13']], ['secrets llm mcp', ['p15-14']],
 ['why rag for copilot', ['p15-16']], ['rag pipeline', ['p15-17']], ['code chunking', ['p15-18']], ['pgvector', ['p15-19']], ['hybrid search', ['p15-20']], ['rag index up to date', ['p15-22']], ['rag evaluation', ['p15-23']],
 ['rag vs long context', ['p15-25']], ['rag security', ['p15-26']], ['rag failure modes', ['p15-28']], ['python rag stack', ['p15-29']], ['rag for end users', ['p15-31']], ['rag adoption', ['p15-33']],
 ['agents vs workflows', ['p15-36']], ['context window', ['p15-37']], ['temperature', ['p15-38']], ['guardrails', ['p15-39']], ['responsible ai gxp', ['p15-40']], ['cursor rules', ['p15-41']], ['ai code review', ['p15-42']], ['system prompt', ['p15-43']], ['structured output', ['p15-44']],
 ['overall architecture irt', ['p16-1']], ['legacy transaction engine', ['p16-2']], ['database per study', ['p16-3']], ['mulesoft to dotnet', ['p16-4']], ['irt integrations', ['p16-5']], ['keycloak', ['p16-6']], ['quartz', ['p16-7']],
 ['rabbitmq in irt', ['p16-8']], ['cache study configuration', ['p16-9']], ['mediatr fluentvalidation', ['p16-10']], ['splunk', ['p16-11']], ['temperature excursion', ['p16-14']], ['material block', ['p16-15']], ['manual drug assignment', ['p16-16']],
 ['supply forecasting', ['p16-17']], ['study transfer between environments', ['p16-18']], ['npm packages shell app', ['p16-19']], ['electronic signature', ['p16-20']], ['production data correction', ['p16-21']], ['alertwatchdog azure functions', ['p14-34']],
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
