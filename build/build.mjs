import fs from 'fs';
const d = JSON.parse(fs.readFileSync('data.json','utf8'));
const L = JSON.parse(fs.readFileSync('list.json','utf8'));
const map = {};
const add = (id, ref) => { (map[id] = map[id] || []); if (!map[id].includes(ref)) map[id].push(ref); };
fs.readFileSync('covered.txt','utf8').trim().split('\n').forEach(l => { const [a,b] = l.trim().split(/\s+/); add(a,b); });
for (let p = 4; p <= 9; p++) d['p'+p].QS.forEach((q,i) => { if (q[7]) q[7].split(',').forEach(id => { if (!id.endsWith('x')) add(id.trim(), 'p'+p+'-'+(i+1)); }); });
d.LIST = L.map(s => ({ n: s.n, title: s.title, items: s.items.map(it => ({ id: it.id, text: it.text, refs: map[it.id] || [] })) }));
const missing = d.LIST.flatMap(s => s.items).filter(i => !i.refs.length);
if (missing.length) { console.error('MISSING', missing.map(i=>i.id).join(',')); process.exit(1); }
const data = JSON.stringify(d).replace(/</g,'\\u003c');
const html = fs.readFileSync('template.html','utf8').replace('__DATA__', () => data);
fs.writeFileSync('../index.html', html);
fs.writeFileSync('../interview-prep.html', html);
console.log('ok', html.length, 'list items', d.LIST.flatMap(s=>s.items).length);
