import fs from 'fs';
const d = JSON.parse(fs.readFileSync('data.json','utf8')); d.p10 = JSON.parse(fs.readFileSync('p10.json','utf8'));
const E = JSON.parse(fs.readFileSync('enrich.json','utf8')); const T = JSON.parse(fs.readFileSync('titles.json','utf8'));
const args = process.argv.slice(2); const ids = [];
for (const a of args) { const m = /^(p\d+)-(\d+)\.\.(\d+)$/.exec(a); if (m) { for (let i = +m[2]; i <= +m[3]; i++) ids.push(m[1] + '-' + i); } else ids.push(a); }
const full = process.env.FULL;
for (const id of ids) { const [p, n] = id.split('-'); const q = d[p].QS[n - 1]; if (!q) continue; const e = E[id] || {};
  console.log('## ' + id + ' [' + q[0] + (q[6] ? ' STORY' : '') + '] ' + (T[id] || q[2]));
  console.log('Y: ' + (e.y || '')); console.log('A: ' + String(q[3]).slice(0, 600)); if (full) { console.log('Q: ' + (e.q || '')); console.log('I: ' + (e.i || []).slice(0, 4).join(' / ')); } }
