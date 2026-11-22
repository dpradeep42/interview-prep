import fs from 'fs';
const d = JSON.parse(fs.readFileSync('data.json','utf8'));
const L = JSON.parse(fs.readFileSync('list.json','utf8'));
d.p10 = JSON.parse(fs.readFileSync('p10.json','utf8'));
d.E = JSON.parse(fs.readFileSync('enrich.json','utf8'));
// keywords/aliases per question: groups whose member appears in the title add all group members (+ manual K: lines)
const AL = JSON.parse(fs.readFileSync('aliases.json','utf8'));
const nrm = t => (' ' + String(t).toLowerCase().replace(/c#/g,' csharp ').replace(/c\+\+/g,' cpp ').replace(/[^a-z0-9\u00c0-\uffff]+/g,' ') + ' ').replace(/\s+/g,' ');
for (const p of ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10']) d[p].QS.forEach((q,i) => {
  const id = p+'-'+(i+1), e = d.E[id] = d.E[id] || {}, t = nrm(q[2]), k = new Set((e.k||'').split(',').map(x=>x.trim()).filter(Boolean));
  AL.forEach(g => { const trig = g.filter((m, j) => j === 0 || m[0] === '*'); if (trig.some(m => t.includes(' ' + nrm(m.replace(/^\*/, '')).trim() + ' '))) g.forEach(m => k.add(m.replace(/^\*/, ''))); });
  if (k.size) e.k = [...k].join(', '); else delete e.k;
});
const map = {};
const add = (id, ref) => { (map[id] = map[id] || []); if (!map[id].includes(ref)) map[id].push(ref); };
fs.readFileSync('covered.txt','utf8').trim().split('\n').forEach(l => { const [a,b] = l.trim().split(/\s+/); add(a,b); });
for (let p = 4; p <= 9; p++) d['p'+p].QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { if (!id.endsWith('x')) add(id.trim(), 'p'+p+'-'+(i+1)); }); });
d.p10.QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { map[id.trim()] = ['p10-'+(i+1)]; }); });
d.LIST = L.map(s => ({ n: s.n, title: s.title, items: s.items.map(it => ({ id: it.id, text: it.text, refs: map[it.id] || [] })) }));
const missing = d.LIST.flatMap(s => s.items).filter(i => !i.refs.length);
if (missing.length) { console.error('MISSING', missing.map(i=>i.id).join(',')); process.exit(1); }
const data = JSON.stringify(d).replace(/</g,'\\u003c');
const html = fs.readFileSync('template.html','utf8').replace('__DATA__', () => data);
fs.writeFileSync('../index.html', html);
fs.writeFileSync('../interview-prep.html', html);
console.log('ok', html.length, 'list items', d.LIST.flatMap(s=>s.items).length);
