// v3 build: multi-file site (index.html, app.css, app.js, sw.js, data/*.json) + single-file offline bundle
import fs from 'fs';
import crypto from 'crypto';
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const d = J('data.json'), L = J('list.json');
d.p10 = J('p10.json');
const E = J('enrich.json');
const AL = J('aliases.json');
const TITLES = fs.existsSync('titles.json') ? J('titles.json') : {};
const DUPS = fs.existsSync('dups.json') ? J('dups.json') : {};
const KIT = J('kit.json'), TOP = J('top50.json');
const PARTS = [
 ['p1','Part 1: Core Technical','C#, .NET, ASP.NET Core, EF Core, WCF, SQL, testing, frontend and the Node/Python/Java stacks.'],
 ['p2','Part 2: Cloud, DevOps, Security, AI, Design','AWS, IaC, containers, CI/CD, observability, Kafka and RabbitMQ, security, MCP and AI tooling, and system design.'],
 ['p3','Part 3: Projects, Scenarios, HR','Your resume story, project deep-dives, production scenarios, STAR behavioural answers, Agile and HR.'],
 ['p4','Part 4: Resume, C#, DI, ASP.NET Core, Web API','Your list sections 1 to 5.'],
 ['p5','Part 5: EF Core, SQL, Microservices, AWS','Your list sections 6 to 9.'],
 ['p6','Part 6: IaC, Docker, K8s, CI/CD, Kafka, RabbitMQ, Testing','Your list sections 10 to 17.'],
 ['p7','Part 7: React, TS, Node/Python, SFTP, WCF, GxP','Your list sections 18 to 23.'],
 ['p8','Part 8: MCP, AI Design, Security, System Design','Your list sections 24 to 27.'],
 ['p9','Part 9: CSV, Releases, Agile, Java, HR, Verification','Your list sections 28 to 34.'],
 ['p10','Part 10: Deep dives (middleware and more)','Standalone deep answers: middleware, custom middleware, filters, options, hosted services, logging, rate limiting, caching, JWT, Span, channels and more.']];
const nrm = t => (' ' + String(t).toLowerCase().replace(/c#/g,' csharp ').replace(/c\+\+/g,' cpp ').replace(/[^a-z0-9\u00c0-\uffff]+/g,' ') + ' ').replace(/\s+/g,' ');
const words = s => (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) || []).length;
// list -> refs
const map = {};
const add = (id, ref) => { (map[id] = map[id] || []); if (!map[id].includes(ref)) map[id].push(ref); };
fs.readFileSync('covered.txt','utf8').trim().split('\n').forEach(l => { const [a,b] = l.trim().split(/\s+/); add(a,b); });
for (let p = 4; p <= 9; p++) d['p'+p].QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { if (!id.endsWith('x')) add(id.trim(), 'p'+p+'-'+(i+1)); }); });
d.p10.QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { map[id.trim()] = ['p10-'+(i+1)]; }); });
const LIST = L.map(s => ({ n: s.n, title: s.title, items: s.items.map(it => ({ id: it.id, text: it.text, refs: map[it.id] || [] })) }));
const missing = LIST.flatMap(s => s.items).filter(i => !i.refs.length);
if (missing.length) { console.error('MISSING', missing.map(i=>i.id).join(',')); process.exit(1); }
const cards = [], detail = {}, parts = [];
let noSay = [];
for (const [key, label, sum] of PARTS) {
  const P = d[key];
  parts.push({ key, label, sum, topics: P.ORDER.map(t => ({ t, label: P.T[t] })) });
  detail[key] = {};
  P.QS.forEach((q, i) => {
    const id = key + '-' + (i + 1), e = E[id] || {};
    const title = TITLES[id] || q[2];
    const t = nrm(title), k = new Set((e.k || '').split(',').map(x => x.trim()).filter(Boolean));
    AL.forEach(g => { const trig = g.filter((m, j) => j === 0 || m[0] === '*'); if (trig.some(m => t.includes(' ' + nrm(m.replace(/^\*/, '')).trim() + ' '))) g.forEach(m => k.add(m.replace(/^\*/, ''))); });
    const say = e.x ? e.x : (e.y ? [e.y] : []);
    if (!e.x) noSay.push(id);
    const w = say.reduce((a, s) => a + words(s), 0);
    const c = { id, p: key, n: i + 1, t: q[0], d: q[1], q: title, h: q[4] || '', s: say, w };
    if (k.size) c.k = [...k].join(', ');
    if (q[5]) c.v = 1;
    if (q[6]) c.st = 1;
    if (DUPS[id]) c.dup = DUPS[id];
    cards.push(c);
    const vis = q[5] ? P.VIS[q[5]] : null;
    detail[key][id] = { a: q[3] || '', fu: q[6] || '', vis, qa: e.q || '', i: e.i || [], c: e.c || [], f: e.f || [], wv: e.w || [] };
  });
}
const core = { v: '', parts, cards, list: LIST, top: TOP, kit: KIT };
const ids = new Set(cards.map(c => c.id));
TOP.forEach(id => { if (!ids.has(id)) { console.error('TOP50 bad id', id); process.exit(1); } });
Object.entries(DUPS).forEach(([a, b]) => { if (!ids.has(a) || !ids.has(b)) { console.error('DUP bad', a, b); process.exit(1); } });
// write
const OUT = '..';
fs.mkdirSync(OUT + '/data', { recursive: true });
const files = {};
files['data/core.json'] = JSON.stringify(core);
for (const k in detail) files['data/d-' + k + '.json'] = JSON.stringify(detail[k]);
const css = fs.readFileSync('web/app.css', 'utf8'), js = fs.readFileSync('web/app.js', 'utf8');
const hash = crypto.createHash('sha1').update(css + js + Object.values(files).join('')).digest('hex').slice(0, 10);
core.v = hash; files['data/core.json'] = JSON.stringify(core);
for (const f in files) fs.writeFileSync(OUT + '/' + f, files[f]);
fs.writeFileSync(OUT + '/app.css', css);
fs.writeFileSync(OUT + '/app.js', js);
const sw = fs.readFileSync('web/sw.js', 'utf8').replace('__V__', hash).replace('__FILES__', JSON.stringify(['./', 'index.html', 'app.css?v=' + hash, 'app.js?v=' + hash, ...Object.keys(files).map(f => f + '?v=' + hash)]));
fs.writeFileSync(OUT + '/sw.js', sw);
const shell = fs.readFileSync('web/index.html', 'utf8');
fs.writeFileSync(OUT + '/index.html', shell.replace(/__V__/g, hash).replace('<!--CSS-->', '<link rel="stylesheet" href="app.css?v=' + hash + '">').replace('<!--JS-->', '<script>window.__V="' + hash + '";</script><script src="app.js?v=' + hash + '" defer></script>'));
// single-file offline bundle
const inline = {}; for (const f in files) inline[f] = JSON.parse(files[f]);
const bundle = shell.replace(/__V__/g, hash).replace('<!--CSS-->', () => '<style>' + css + '</style>')
  .replace('<!--JS-->', () => '<script>window.__V="' + hash + '";window.__SINGLE=1;window.__INLINE=' + JSON.stringify(inline).replace(/</g, '\\u003c') + ';</script><script>' + js.replace(/<\/script/gi, '<\\/script') + '</script>');
fs.writeFileSync(OUT + '/interview-prep.html', bundle);
const ws = cards.map(c => c.w).sort((a, b) => a - b);
console.log('ok v', hash, 'cards', cards.length, 'list', LIST.flatMap(s => s.items).length, 'core KB', (files['data/core.json'].length / 1024).toFixed(0), 'bundle KB', (bundle.length / 1024).toFixed(0));
console.log('say words min', ws[0], 'median', ws[ws.length >> 1], 'max', ws[ws.length - 1], 'still old (no X):', noSay.length);
