import * as esbuild from 'esbuild';
import fs from 'fs';
const out = {};
for (const i of [1,2,3,4,5,6,7,8,9]) {
  let src = fs.readFileSync(`p${i}.tsx`,'utf8');
  src = src.replace(/^import .*$/mg, '');
  src = src.replace(/export default function App/, 'function App');
  src += `\nexport { QS, T, ORDER, visual };\n`;
  const pre = `const h=(type,props,...children)=>({type: typeof type==='string'?type:(type.name||'Fragment'), props: props||{}, children});
const Fragment=function Fragment(){};
const mk=n=>{const f=function(){}; Object.defineProperty(f,'name',{value:n}); return f;};
const Table=mk('Table'),Diagram=mk('Diagram'),Sequence=mk('Sequence'),Steps=mk('Steps'),ColumnSeries=mk('ColumnSeries');
const useGrokTheme=()=>({});const useState=()=>[];const useMemo=f=>f();\n`;
  const r = await esbuild.transform(pre+src, {loader:'tsx', jsxFactory:'h', jsxFragment:'Fragment', format:'esm'});
  fs.writeFileSync(`p${i}.mjs`, r.code);
  const m = await import(`./p${i}.mjs?${Date.now()}`);
  const vis = {};
  for (const q of m.QS) if (q[5] && !vis[q[5]]) { const v = m.visual(q[5]); vis[q[5]] = v; }
  out['p'+i] = { T: m.T, ORDER: m.ORDER, QS: m.QS, VIS: vis };
}
fs.writeFileSync('data.json', JSON.stringify(out));
for (const k in out) { const p=out[k]; console.log(k, p.QS.length, 'vis', Object.keys(p.VIS).length, 'pics', p.QS.filter(q=>q[5]).length, 'fu', p.QS.filter(q=>q[6]).length, 'types', [...new Set(Object.values(p.VIS).map(v=>v&&v.type))].join(',')); }
