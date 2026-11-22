// v4 build: minimal "search -> read aloud" site. Writes index.html, app.css, app.js, sw.js, data/index.json, data/answers.json,
// interview-prep.html (single-file offline copy) and NOTES-invented-details.md (private notes: every invented detail per answer).
import fs from 'fs';
import crypto from 'crypto';
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const d = J('data.json'), L = J('list.json');
for (const k of ['p10', 'p11', 'p12', 'p13', 'p14']) d[k] = fs.existsSync(k + '.json') ? J(k + '.json') : { T: {}, ORDER: [], QS: [], VIS: {} };
const E = J('enrich.json'), AL = J('aliases.json');
const TITLES = fs.existsSync('titles.json') ? J('titles.json') : {};
const DUPS = fs.existsSync('dups.json') ? J('dups.json') : {};
const KEYS = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14'];
const nrm = t => (' ' + String(t).toLowerCase().replace(/c#/g,' csharp ').replace(/c\+\+/g,' cpp ').replace(/[^a-z0-9\u00c0-\uffff]+/g,' ') + ' ').replace(/\s+/g,' ');
const words = s => (s.match(/[A-Za-z0-9][A-Za-z0-9'’.\-]*/g) || []).length;
// list item -> canonical cards
const map = {};
const add = (id, ref) => { (map[id] = map[id] || []); if (!map[id].includes(ref)) map[id].push(ref); };
fs.readFileSync('covered.txt','utf8').trim().split('\n').forEach(l => { const [a,b] = l.trim().split(/\s+/); add(a,b); });
for (let p = 4; p <= 9; p++) d['p'+p].QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { if (!id.endsWith('x')) add(id.trim(), 'p'+p+'-'+(i+1)); }); });
d.p10.QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { map[id.trim()] = ['p10-'+(i+1)]; }); });
const items = L.flatMap(s => s.items.map(it => ({ id: it.id, text: it.text, refs: map[it.id] || [] })));
const missing = items.filter(i => !i.refs.length);
if (missing.length) { console.error('MISSING', missing.map(i=>i.id).join(',')); process.exit(1); }
// text clean-up: brackets mark invented details in the source; on screen they are plain words. Trailing "I can explain..." offers are dropped.
const OFFER = /^(I can|I could|I'?d be happy|Happy to|If you'?d like|If useful|Let me know)\b/i;
const unbr = s => s.replace(/\[([^\[\]]+)\]/g, '$1');
function clean(paras) {
  const out = paras.map(p => p.trim()).filter(Boolean);
  for (;;) {
    if (!out.length) break;
    const last = out[out.length - 1], ss = last.split(/(?<=[.!?])\s+/);
    if (!OFFER.test(ss[ss.length - 1])) break;
    ss.pop(); if (ss.length) out[out.length - 1] = ss.join(' '); else out.pop();
  }
  return out.map(unbr);
}
const KEEPVIS = { Diagram: 1, Sequence: 1, Pyramid: 1, ColumnSeries: 1 };   // pictures only; tables/step lists would just be more to read
const unbrDeep = v => typeof v === 'string' ? unbr(v) : Array.isArray(v) ? v.map(unbrDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, unbrDeep(x)])) : v;
const byId = {}; const byIdDup = id => byId[id] && byId[id].dup;
const topics = {}, cards = [], answers = {}, notes = [], slugs = {}, stats = [];
const bad = [], shade = {};
for (const key of KEYS) {
  const P = d[key];
  P.ORDER.forEach(t => { topics[key + ':' + t] = P.T[t]; });
  P.QS.forEach((q, i) => {
    const id = key + '-' + (i + 1), e = E[id] || {};
    const title = TITLES[id] || q[2];
    if (!e.x || !e.x.length) { bad.push(id + ' no spoken answer'); return; }
    const t = nrm(title), k = new Set((e.k || '').split(',').map(x => x.trim()).filter(Boolean));
    AL.forEach(g => { const trig = g.filter((m, j) => j === 0 || m[0] === '*'); if (trig.some(m => t.includes(' ' + nrm(m.replace(/^\*/, '')).trim() + ' '))) g.forEach(m => k.add(m.replace(/^\*/, ''))); });
    let slug = title.toLowerCase().replace(/c#/g, 'csharp').replace(/\.net/g, 'dotnet').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 9).join('-') || id;
    if (slugs[slug]) slug += '-' + id; slugs[slug] = id;
    const c = { id, p: key, t: q[0], q: title, sl: slug };
    if (k.size) c.k = [...k].join(', ');
    if (DUPS[id]) c.dup = DUPS[id];
    cards.push(c); byId[id] = c;
    const m = {};   // shaded ranges per paragraph: text that is also covered in another answer
    const s = clean(e.x).map((p, pi) => { let out = '', r = []; p.split(/(\{\{|\}\})/).forEach(t => { if (t === '{{') r.push([out.length]); else if (t === '}}') r[r.length - 1].push(out.length); else out += t; }); if (r.length) m[pi] = r; return out; });
    const w = s.reduce((a, x) => a + words(x), 0);
    if (/\[|\]|\{\{|\}\}/.test(s.join(' '))) bad.push(id + ' bracket left');
    shade[id] = m;
    if (/\bas (I )?mentioned\b|\bsee (part|section|question)\b|\bother answer\b/i.test(s.join(' '))) bad.push(id + ' cross-reference');
    const a = { s };
    const vis = q[5] ? P.VIS[q[5]] : null;
    if (vis && KEEPVIS[vis.type]) a.v = unbrDeep(vis);
    answers[id] = a;
    if (!c.dup) stats.push({ id, w });
    const inv = [];
    e.x.forEach(p => { for (const m of p.matchAll(/\[([^\[\]]+)\]/g)) if (!inv.includes(m[1])) inv.push(m[1]); });
    if (inv.length) notes.push('- **' + id + '** ' + title + '\n  - ' + inv.join('\n  - '));
  });
}
if (bad.length) { console.error('PROBLEMS', bad.join('; ')); process.exit(1); }
// automatic overlap: near-duplicate sentences across different answers (content-word Jaccard or 3-word-shingle containment >= 0.45,
// at least 7 content words, shingles used by more than 40 sentences ignored as generic). A shared sentence is shaded in the answer
// whose title it is less about, so "What is middleware?" keeps its own definition plain while "custom middleware" shows it shaded.
{
  const STOPW = new Set('a an the is are was were be been of to in on and or for with as at by from that this it its i we our you your my me so then than but if not no do does did can could would should will just also into about which what when where how who there their they them one each every all any some more most very like up out over only after before because while has have had using use used uses'.split(' '));
  const stw = w => w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w;
  const tk = x => (x.toLowerCase().match(/[a-z0-9][a-z0-9.+#-]*/g) || []).map(w => w.replace(/\.$/, '')).filter(w => !STOPW.has(w)).map(stw);
  const titleT = {}; cards.forEach(c => { titleT[c.id] = new Set(tk(c.q)); });
  const S = [];
  for (const c of cards) { if (c.dup) continue; answers[c.id].s.forEach((p, pi) => { let pos = 0; for (const t of p.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)) { const st = p.indexOf(t, pos); pos = st + t.length; const k = tk(t); const sh = new Set(); for (let i = 0; i + 3 <= k.length; i++) sh.add(k.slice(i, i + 3).join(' ')); S.push({id: c.id, pi, st, en: st + t.length, set: new Set(k), sh}); } }); }
  const inv = {}; S.forEach((x, i) => x.sh.forEach(g => (inv[g] = inv[g] || []).push(i)));
  const tscore = (x, id) => { let n = 0; titleT[id].forEach(w => { if (x.set.has(w)) n++; }); return n; };
  let auto = 0;
  S.forEach(x => {
    if (x.set.size < 7) return;
    const cnt = {}; x.sh.forEach(g => { if (inv[g].length > 40) return; inv[g].forEach(j => { if (S[j].id !== x.id) cnt[j] = (cnt[j] || 0) + 1; }); });
    let hit = false;
    for (const j in cnt) { const o = S[j]; let n = 0; x.set.forEach(w => { if (o.set.has(w)) n++; }); const sc = Math.max(n / (x.set.size + o.set.size - n), cnt[j] / Math.max(1, x.sh.size));
      if (sc >= 0.45 && !(tscore(x, x.id) > tscore(x, o.id))) { hit = true; break; } }
    if (!hit) return;
    const m = shade[x.id], r = (m[x.pi] = m[x.pi] || []);
    if (!r.some(([a, b]) => a <= x.st && b >= x.en)) { r.push([x.st, x.en]); auto++; }
  });
  for (const id in shade) { const m = shade[id]; for (const pi in m) { const r = m[pi].sort((a, b) => a[0] - b[0]), out = []; r.forEach(([a, b]) => { const l = out[out.length - 1]; if (l && a <= l[1] + 1) l[1] = Math.max(l[1], b); else out.push([a, b]); }); m[pi] = out; } if (Object.keys(m).length) answers[id].m = m; }
  console.log('shaded answers', Object.keys(answers).filter(id => answers[id].m && !byIdDup(id)).length, 'auto sentences', auto);
}
// "also asked as": your list items + merged duplicates, so every wording is searchable

const aka = {};
items.forEach(it => it.refs.forEach(r => { const tgt = byId[r] && byId[r].dup ? byId[r].dup : r; (aka[tgt] = aka[tgt] || []).push(it.text); }));
cards.forEach(c => { if (c.dup) (aka[c.dup] = aka[c.dup] || []).push(c.q); });
cards.forEach(c => { const seen = new Set([nrm(c.q)]); const a = (aka[c.id] || []).filter(x => { const n = nrm(x); if (seen.has(n)) return false; seen.add(n); return true; }); if (a.length && !c.dup) c.a = a; });
// home list: your question-list sections first (first occurrence wins), then every other card by topic
const home = [], placed = new Set(), canon = id => (byId[id] && byId[id].dup) || id;
L.forEach(sec => { const ids = []; sec.items.forEach(it => (map[it.id] || []).forEach(r => { const c = canon(r); if (byId[c] && !placed.has(c)) { placed.add(c); ids.push(c); } })); if (ids.length) home.push([sec.n + '. ' + sec.title.replace(/\s+[—-]+\s+.*$/, '').replace(/[“”]/g, '"'), ids]); });
const REST = [['p13', 'fe'], ['p13', 'irt'], ['p13', 'irts'], ['p14', 'hyb'], ['p14', 'map'], ['p11', 'ng'], ['p12', 'rts'],
  ['.NET, C# and ASP.NET Core deep dives', ['p10:mw', 'p10:net', 'p1:cs', 'p1:api', 'p1:ef', 'p1:sql']],
  ['More: testing, front end and other languages', ['p1:test', 'p1:fe', 'p1:poly']],
  ['More: cloud, DevOps, messaging, security and AI', ['p2:aws', 'p2:iac', 'p2:k8s', 'p2:cicd', 'p2:obs', 'p2:msg', 'p2:sec', 'p2:ai', 'p2:sd']],
  ['More: projects, scenarios and behavioural', ['p3:intro', 'p3:proj', 'p3:scen', 'p3:star', 'p3:agile', 'p3:hr']]];
REST.forEach(([a, b]) => { const keys = Array.isArray(b) ? b : [a + ':' + b], label = Array.isArray(b) ? a : topics[a + ':' + b];
  const ids = cards.filter(c => keys.includes(c.p + ':' + c.t) && !c.dup && !placed.has(c.id)).map(c => c.id); ids.forEach(i => placed.add(i)); if (ids.length) home.push([label, ids]); });
const unplaced = cards.filter(c => !c.dup && !placed.has(c.id)); if (unplaced.length) { console.error('HOME missing', unplaced.map(c => c.id).join(' ')); process.exit(1); }
console.log('home sections', home.length, 'questions', placed.size);
const index = { v: '', topics, cards, items: items.length, home };
fs.writeFileSync('itemmap.json', JSON.stringify(items.map(it => [it.id, it.text, [...new Set(it.refs.map(r => byId[r] && byId[r].dup ? byId[r].dup : r))]])));
// write
const OUT = '..';
fs.mkdirSync(OUT + '/data', { recursive: true });
['core.json', ...KEYS.map(k => 'd-' + k + '.json')].forEach(f => { try { fs.unlinkSync(OUT + '/data/' + f); } catch (e) {} });
const css = fs.readFileSync('web/app.css', 'utf8'), js = fs.readFileSync('web/app.js', 'utf8'), shell = fs.readFileSync('web/index.html', 'utf8');
const ansJ = JSON.stringify(answers);
const hash = crypto.createHash('sha1').update(css + js + shell + JSON.stringify(index) + ansJ).digest('hex').slice(0, 10);
index.v = hash;
const files = { 'data/index.json': JSON.stringify(index), 'data/answers.json': ansJ };
for (const f in files) fs.writeFileSync(OUT + '/' + f, files[f]);
fs.writeFileSync(OUT + '/app.css', css);
fs.writeFileSync(OUT + '/app.js', js);
fs.writeFileSync(OUT + '/sw.js', fs.readFileSync('web/sw.js', 'utf8').replace('__V__', hash).replace('__FILES__', JSON.stringify(['./', 'index.html', 'app.css?v=' + hash, 'app.js?v=' + hash, ...Object.keys(files).map(f => f + '?v=' + hash)])));
fs.writeFileSync(OUT + '/index.html', shell.replace(/__V__/g, hash).replace('<!--CSS-->', '<link rel="stylesheet" href="app.css?v=' + hash + '">').replace('<!--JS-->', '<script>window.__V="' + hash + '";</script><script src="app.js?v=' + hash + '" defer></script>'));
const inline = {}; for (const f in files) inline[f] = JSON.parse(files[f]);
fs.writeFileSync(OUT + '/interview-prep.html', shell.replace(/__V__/g, hash).replace('<!--CSS-->', () => '<style>' + css + '</style>')
  .replace('<!--JS-->', () => '<script>window.__V="' + hash + '";window.__SINGLE=1;window.__INLINE=' + JSON.stringify(inline).replace(/</g, '\\u003c') + ';</script><script>' + js.replace(/<\/script/gi, '<\\/script') + '</script>'));
if (process.env.NOTES) fs.writeFileSync(OUT + '/NOTES-invented-details.md', '# Invented details (private notes)\n\n' + fs.readFileSync('notes-shared.md', 'utf8') + '\n' +
  'Every detail below was **invented** to make the spoken stories concrete. They are not from the resume. ' +
  'On the site they appear as ordinary sentences, with no brackets. Learn them, keep them consistent, or replace them with your real numbers before an interview.\n\n' +
  'Facts that come from the resume (not invented): deployments 6 hours to 2, 6 people to 1, about 77 MCP tools, the CIRT MCP server, the ~100-member engineering organisation.\n\n' +
  '## By answer\n\n' + notes.join('\n') + '\n');
const ws = stats.map(x => x.w).sort((a, b) => a - b);
console.log('ok v', hash, 'cards', cards.length, 'answers (canonical)', stats.length, 'list items', items.length, 'index KB', (files['data/index.json'].length / 1024).toFixed(0), 'answers KB', (ansJ.length / 1024).toFixed(0), 'vis', Object.values(answers).filter(a => a.v).length);
console.log('words min', ws[0], 'median', ws[ws.length >> 1], 'max', ws[ws.length - 1], 'under150', stats.filter(x => x.w < 150).map(x => x.id + ':' + x.w).join(' '));
