// Parses enrich/*.txt into enrich.json (deep layer for every question) and new.json (new questions for part 10)
import fs from 'fs';
const E = {}, NEW = [];
const files = fs.readdirSync('enrich').filter(f => f.endsWith('.txt')).sort();
for (const f of files) {
  const lines = fs.readFileSync('enrich/' + f, 'utf8').split('\n');
  let cur = null, code = null;
  for (let ln of lines) {
    if (code) { if (ln.trim() === '```') { cur.c.push([code.lang, code.buf.join('\n')]); code = null; } else code.buf.push(ln); continue; }
    if (ln.startsWith('+@')) {
      const id = ln.slice(2).trim();
      if (!E[id]) console.warn('APPEND TO MISSING', id, f);
      cur = E[id] || (E[id] = { q: '', i: [], c: [], f: [], w: [] });
      continue;
    }
    if (ln.startsWith('@')) {
      const id = ln.slice(1).trim();
      if (E[id]) console.warn('DUP', id, f);
      cur = E[id] = { q: '', i: [], c: [], f: [], w: [] };
      if (id.startsWith('p10-')) NEW.push({ id, cur });
      continue;
    }
    if (!cur || !ln.trim()) continue;
    if (ln.startsWith('```')) { code = { lang: ln.slice(3).trim() || 'text', buf: [] }; continue; }
    const m = /^([QTDSHAVLWYK]):\s?(.*)$/.exec(ln);
    if (m) {
      const [, k, v] = m;
      if (k === 'Q') cur.q = (cur.q ? cur.q + ' ' : '') + v;
      else if (k === 'W') cur.w.push(v);
      else if (k === 'Y') cur.y = (cur.y ? cur.y + ' ' : '') + v;
      else if (k === 'K') cur.k = (cur.k ? cur.k + ', ' : '') + v;
      else cur['_' + k] = v;
      continue;
    }
    if (ln.startsWith('- ')) { cur.i.push(ln.slice(2)); continue; }
    if (ln.startsWith('? ')) { const [a, b] = ln.slice(2).split(' :: '); cur.f.push([a.trim(), (b || '').trim()]); continue; }
    if (ln.startsWith('  ') && cur.i.length) { cur.i[cur.i.length - 1] += ' ' + ln.trim(); continue; }
    console.warn('UNPARSED', f, ln.slice(0, 80));
  }
  if (code) console.warn('UNCLOSED CODE', f);
}
// build part 10 tuples
const p10 = { T: { mw: 'ASP.NET Core deep dives', net: '.NET and C# deep dives' }, ORDER: ['mw', 'net'], QS: [], VIS: {} };
const vis10 = fs.existsSync('vis10.json') ? JSON.parse(fs.readFileSync('vis10.json', 'utf8')) : {};
NEW.sort((a, b) => +a.id.split('-')[1] - +b.id.split('-')[1]).forEach(({ id, cur }, i) => {
  if (+id.split('-')[1] !== i + 1) console.warn('P10 GAP at', id);
  const t = [cur._S, cur._D, cur._T, cur._A || '', cur._H || '', cur._V || '', '', cur._L || ''];
  if (!t[0] || !t[1] || !t[2]) console.warn('P10 MISSING HEADER', id);
  p10.QS.push(t);
  if (cur._V) { if (!vis10[cur._V]) console.warn('NO VIS', cur._V); p10.VIS[cur._V] = vis10[cur._V]; }
  for (const k of ['_S', '_D', '_T', '_A', '_H', '_V', '_L']) delete cur[k];
});
for (const k in E) { const e = E[k]; if (!e.q) console.warn('NO QUICK', k); if (!e.c.length) delete e.c; if (!e.f.length) delete e.f; if (!e.w.length) delete e.w; }
fs.writeFileSync('enrich.json', JSON.stringify(E));
fs.writeFileSync('p10.json', JSON.stringify(p10));
console.log('enriched', Object.keys(E).length, 'p10', p10.QS.length, 'bytes', JSON.stringify(E).length);
