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
      if (/^p1[0-9]-/.test(id)) NEW.push({ id, cur });
      continue;
    }
    if (!cur || !ln.trim()) continue;
    if (ln.startsWith('```')) { code = { lang: ln.slice(3).trim() || 'text', buf: [] }; continue; }
    const m = /^([QTDSHAVLWYKX]):\s?(.*)$/.exec(ln);
    if (m) {
      const [, k, v] = m;
      if (k === 'Q') cur.q = (cur.q ? cur.q + ' ' : '') + v;
      else if (k === 'W') cur.w.push(v);
      else if (k === 'Y') cur.y = (cur.y ? cur.y + ' ' : '') + v;
      else if (k === 'K') cur.k = (cur.k ? cur.k + ', ' : '') + v;
      else if (k === 'X') (cur.x = cur.x || []).push(v);
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
// build new-question parts (p10 deep dives, p11 Angular, p12 React + TypeScript, p13 front end in IRT + IRT domain)
const NEWPARTS = {
  p10: { T: { mw: 'ASP.NET Core deep dives', net: '.NET and C# deep dives' }, ORDER: ['mw', 'net'] },
  p11: { T: { ng: 'Angular' }, ORDER: ['ng'] },
  p12: { T: { rts: 'React and TypeScript' }, ORDER: ['rts'] },
  p13: { T: { fe: 'Front end in IRT: Angular and React', irt: 'IRT: clinical studies and modules', irts: 'IRT stories' }, ORDER: ['fe', 'irt', 'irts'] },
  p14: { T: { hyb: 'On-premise Azure DevOps and AWS: the CIRT story', map: 'Azure to AWS: how the concepts map', awd: 'AlertWatchDog and Azure Functions (and the AWS way)' }, ORDER: ['hyb', 'map', 'awd'] },
  p15: { T: { mcp: 'AI: the CIRT MCP server in .NET 8', rag: 'AI: RAG for Copilot and Cursor (Python)', ragu: 'AI: the RAG assistant for end users', ai: 'AI: applied AI engineering' }, ORDER: ['mcp', 'rag', 'ragu', 'ai'] }
};
const vis10 = fs.existsSync('vis10.json') ? JSON.parse(fs.readFileSync('vis10.json', 'utf8')) : {};
const OUTP = {};
for (const key in NEWPARTS) {
  const P = OUTP[key] = { T: NEWPARTS[key].T, ORDER: NEWPARTS[key].ORDER, QS: [], VIS: {} };
  NEW.filter(x => x.id.split('-')[0] === key).sort((a, b) => +a.id.split('-')[1] - +b.id.split('-')[1]).forEach(({ id, cur }, i) => {
    if (+id.split('-')[1] !== i + 1) console.warn(key + ' GAP at', id);
    const t = [cur._S, cur._D, cur._T, cur._A || '', cur._H || '', cur._V || '', '', cur._L || ''];
    if (!t[0] || !t[1] || !t[2]) console.warn(key + ' MISSING HEADER', id);
    if (!P.T[t[0]]) console.warn(key + ' BAD TOPIC', id, t[0]);
    P.QS.push(t);
    if (cur._V) { if (!vis10[cur._V]) console.warn('NO VIS', cur._V); P.VIS[cur._V] = vis10[cur._V]; }
    for (const k of ['_S', '_D', '_T', '_A', '_H', '_V', '_L']) delete cur[k];
    if (!cur.q && key !== 'p10') cur.q = (cur.x || [''])[0];
  });
}
for (const k in E) { const e = E[k]; if (!e.q) console.warn('NO QUICK', k); if (!e.c.length) delete e.c; if (!e.f.length) delete e.f; if (!e.w.length) delete e.w; }
fs.writeFileSync('enrich.json', JSON.stringify(E));
for (const key in OUTP) fs.writeFileSync(key + '.json', JSON.stringify(OUTP[key]));
console.log('enriched', Object.keys(E).length, Object.keys(OUTP).map(k => k + ' ' + OUTP[k].QS.length).join(' '), 'bytes', JSON.stringify(E).length);
