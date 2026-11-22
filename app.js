/* Interview answers: search a question, read the answer aloud. Nothing else. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
function mesc(s) { return String(s).replace(/[#&<>";]/g, function (c) { return '#' + c.charCodeAt(0) + ';'; }); }
function getJSON(p) {
  if (window.__INLINE && window.__INLINE[p]) return Promise.resolve(window.__INLINE[p]);
  var V = window.__V || '';
  return fetch(p + (V ? '?v=' + V : '')).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
}
var CARDS = [], BYID = {}, BYSLUG = {}, TOPIC = {}, AKA = {}, ANS = null, ansP = null;

/* ================= search (ranking, synonyms, aliases) ================= */
var STOP = {a:1, an:1, the:1, is:1, are:1, of:1, to:1, 'in':1, on:1, and:1, vs:1, versus:1, 'do':1, does:1, you:1, your:1, i:1, what:1, how:1, it:1, its:1, be:1, s:1, with:1, for:1, or:1, me:1, we:1, between:1, difference:1};
var KEEPS = {does:1, has:1, was:1, yes:1, its:1, this:1, alias:1, always:1, perhaps:1, kubernetes:1, aws:1, sms:1, dns:1, https:1, cors:1, iis:1, ecs:1, eks:1, rds:1, sns:1, sqs:1, sales:1};
function stem(w) {
  if (w.length <= 3 || KEEPS[w]) return w;
  if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + 'y';
  if (/(sses|xes|ches|shes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(ss|us|is|os)$/.test(w)) return w.slice(0, -1);
  return w;
}
function norm(t) {
  return (' ' + String(t).toLowerCase().replace(/c#/g, ' csharp ').replace(/c\+\+/g, ' cpp ').replace(/f#/g, ' fsharp ')
    .replace(/\.net\b/g, ' dotnet ').replace(/\bn\s*\+\s*1\b/g, ' nplus1 ').replace(/\bci\s*\/\s*cd\b/g, ' ci cd ')
    .replace(/[^a-z0-9\u00c0-\uffff]+/g, ' ') + ' ').replace(/\s+/g, ' ');
}
function toks(t) { var n = norm(t).trim(); return n ? n.split(' ').map(stem) : []; }
var SYN = [
  ['di', 'dependency injection'], ['ioc', 'inversion of control'], ['jwt', 'json web token', 'bearer token'], ['k8s', 'kubernetes'], ['kube', 'kubernetes'],
  ['ef', 'entity framework'], ['ef core', 'entity framework core'], ['gc', 'garbage collection', 'garbage collector'], ['sso', 'single sign on'], ['iac', 'infrastructure as code'],
  ['dlq', 'dead letter queue', 'dead letter'], ['oop', 'object oriented', 'oops'], ['rag', 'retrieval augmented generation'], ['mcp', 'model context protocol'],
  ['ci cd', 'cicd', 'continuous integration', 'pipeline'], ['vm', 'virtual machine'], ['db', 'database'], ['js', 'javascript'], ['ts', 'typescript'],
  ['auth', 'authentication'], ['authn', 'authentication'], ['authz', 'authorization'], ['async', 'asynchronous'], ['sync', 'synchronous'],
  ['config', 'configuration'], ['perf', 'performance'], ['optimise', 'optimize'], ['optimisation', 'optimization'], ['optimization', 'optimize'], ['prioritise', 'prioritize'],
  ['n 1', 'nplus1'], ['n plus 1', 'nplus1'], ['tmay', 'tell me about yourself'], ['introduce yourself', 'tell me about yourself'], ['self introduction', 'tell me about yourself'], ['intro', 'tell me about yourself'],
  ['why leave', 'why are you looking for a change', 'why change'], ['leaving', 'looking for a change'], ['switch job', 'looking for a change'],
  ['ctc', 'salary'], ['expected ctc', 'salary expectation'], ['compensation', 'salary'], ['joining', 'notice period'],
  ['lifetime', 'singleton scoped transient'], ['scoped', 'scope'], ['filter', 'action filter'], ['msg', 'messaging'], ['mq', 'rabbitmq'], ['rabbit', 'rabbitmq'],
  ['index', 'indexing'], ['await', 'async await'], ['hooks', 'react hooks'], ['solid', 'solid principles'],
  ['singleton pattern', 'design pattern'], ['api gateway', 'apigw'], ['sp', 'stored procedure'], ['sproc', 'stored procedure'], ['pr', 'pull request'],
  ['xss', 'cross site scripting'], ['csrf', 'cross site request forgery'], ['sqli', 'sql injection'], ['oauth', 'oauth2'], ['oidc', 'openid connect'],
  ['tdd', 'test driven'], ['bdd', 'behaviour driven', 'behavior driven'], ['llm', 'large language model'], ['ai agent', 'agentic'], ['gxp', 'regulated']
].map(function (g) { return g.map(function (p) { return toks(p); }); });
var LEADS = [
  ['what is a', 'def'], ['what is an', 'def'], ['what is the', 'def'], ['what is', 'def'], ['what are the', 'def'], ['what are', 'def'], ['what s', 'def'], ['what does', 'def'],
  ['explain the', 'def'], ['explain', 'def'], ['define', 'def'], ['describe the', 'def'], ['describe your', 'def'], ['describe', 'def'],
  ['tell me about the', 'def'], ['tell me about a', 'def'], ['tell me about your', 'def'], ['tell me about', 'def'], ['walk me through', 'def'],
  ['how do you write', 'proc'], ['how do you', 'proc'], ['how does', 'proc'], ['how do', 'proc'], ['how would you', 'proc'], ['how did you', 'proc'], ['how to', 'proc'],
  ['why do we need', 'proc'], ['why do we use', 'proc'], ['why use', 'proc'], ['why did you', 'proc'], ['when would you', 'proc'], ['what happens if', 'proc'], ['what happens when', 'proc']
].map(function (l) { return [toks(l[0]), l[1]]; });
function seqIdx(arr, sub, pre) {
  outer: for (var i = 0; i <= arr.length - sub.length; i++) {
    for (var j = 0; j < sub.length; j++) {
      var a = arr[i + j], b = sub[j];
      if (a === b) continue;
      if (pre && j === sub.length - 1 && b.length >= 3 && a.indexOf(b) === 0) continue;
      continue outer;
    }
    return i;
  }
  return -1;
}
function splitLead(tt) {
  for (var i = 0; i < LEADS.length; i++) { var L = LEADS[i][0]; if (L.length < tt.length && seqIdx(tt.slice(0, L.length), L) === 0) return {core: tt.slice(L.length), kind: LEADS[i][1]}; }
  return {core: tt, kind: ''};
}
var DF = {}, NDOC = 1;
function idf(w) { return Math.log(1 + NDOC / (1 + (DF[w] || 0))); }
function indexCard(c) {
  c.tt = toks(c.q); c.ts = {}; c.tt.forEach(function (w) { c.ts[w] = 1; });
  var sl = splitLead(c.tt); c.core = sl.core; c.lead = sl.kind;
  c.al = (AKA[c.id] || []).map(function (a) { var t = toks(a.text); return {t: t, core: splitLead(t).core}; });
  c.as = {}; c.al.forEach(function (a) { a.t.forEach(function (w) { c.as[w] = 1; }); });
  c.ks = {}; c.kp = (c.k || '').split(',').map(function (k) { var t = toks(k); t.forEach(function (w) { c.ks[w] = 1; }); return t; });
  c.ps = {}; toks(TOPIC[c.p + ':' + c.t] || '').forEach(function (w) { c.ps[w] = 1; });
  var seen = {}; [c.ts, c.as, c.ks].forEach(function (s) { for (var w in s) seen[w] = 1; });
  for (var w in seen) DF[w] = (DF[w] || 0) + 1;
}
function has(set, q, pre) { if (set[q]) return 2; if (pre && q.length >= 3) for (var w in set) if (w.indexOf(q) === 0) return 1; return 0; }
function variants(qt) {
  var out = [{t: qt, pen: 0}], seen = {}; seen[qt.join(' ')] = 1;
  function addV(t, pen) { var k = t.join(' '); if (!seen[k] && out.length < 14) { seen[k] = 1; out.push({t: t, pen: pen}); } }
  var vs = qt.indexOf('vs'); if (vs < 0) vs = qt.indexOf('versus');
  if (vs > 0 && vs < qt.length - 1) addV(qt.slice(vs + 1).concat(['vs'], qt.slice(0, vs)), 0);
  for (var round = 0; round < 2; round++) {
    out.slice().forEach(function (v) {
      SYN.forEach(function (g) {
        g.forEach(function (m, mi) {
          var at = seqIdx(v.t, m); if (at < 0) return;
          g.forEach(function (o, oi) { if (oi !== mi) addV(v.t.slice(0, at).concat(o, v.t.slice(at + m.length)), v.pen + 4); });
        });
      });
    });
  }
  return out;
}
function scoreVariant(c, v, pre) {
  var all = v.t, ct = all.filter(function (w) { return !STOP[w]; });
  if (!ct.length) ct = all;
  var last = all[all.length - 1];
  var W = 0, tW = 0, uW = 0, allT = true, allU = true, allA = true, allTP = true, prefixUsed = false;
  ct.forEach(function (q) {
    var w = DF[q] ? idf(q) : (pre && q === last ? idf(q) : 1), p = pre && q === last;   // unknown words count for little
    W += w;
    var ht = has(c.ts, q, p), ha = has(c.as, q, p), hk = has(c.ks, q, p), hp = has(c.ps, q, false);
    if (ht === 1 || (!ht && (ha === 1 || hk === 1))) prefixUsed = true;
    if (ht) tW += w; else allT = false;
    if (!ht && !hp) allTP = false;
    if (!ha) allA = false;
    if (ht || ha || hk || hp) uW += w; else allU = false;
  });
  if (!W) return 0;
  var phraseT = seqIdx(c.tt, all, pre) >= 0 || (ct.length > 1 && seqIdx(c.tt.filter(function (w) { return !STOP[w]; }), ct, pre) >= 0);
  var phraseA = false, aliasExact = false, aliasStart = false, aliasFull = false;
  c.al.forEach(function (a) {
    if (seqIdx(a.t, all, pre) >= 0) phraseA = true;
    if (a.t.join(' ') === all.join(' ') && all.length > 1) aliasFull = true;
    if (a.core.join(' ') === all.join(' ') || a.t.join(' ') === all.join(' ')) aliasExact = true;
    else if (seqIdx(a.core, all, pre) === 0) aliasStart = true;
  });
  var kwPhrase = c.kp.some(function (k) { return k.length && seqIdx(k, ct) >= 0; });
  var s = 0, len = c.tt.length;
  if (phraseT || allT) {
    s = phraseT ? 1000 : 800;
    var core = c.core.join(' '), q = all.join(' '), qc = ct.join(' ');
    if (core === q || core === qc || c.tt.join(' ') === q) s += 60;
    else if (seqIdx(c.core, all, pre) === 0 || seqIdx(c.core, ct, pre) === 0) s += 40;
    var pos = seqIdx(c.core, [ct[0]], pre);
    if (pos >= 0 && pos <= 2) s += c.lead === 'def' ? 30 : c.lead === 'proc' ? 10 : 20;
    if (all.indexOf('vs') >= 0 && c.ts.vs) s += 20;
    s -= len;
  } else if (allTP && tW / W >= 0.4) {   // the title has the main words and the topic covers the rest ("sql index" -> a SQL-topic index question)
    s = 760 + 60 * (tW / W) - len;
  } else if (phraseA || allA) {
    s = phraseA ? 700 : 650; s -= len / 2;
  } else if (allU) {
    s = 450 + 60 * (tW / W) + (kwPhrase ? 15 : 0) - len / 2;
  } else if (uW / W >= 0.5 && tW > 0) {
    s = 100 + 200 * (uW / W) + 60 * (tW / W) - len / 2;
  }
  if (aliasFull && s < 1090) s = 1090;   // the exact wording of one of your list questions
  if (!s) return 0;
  if (aliasExact) s += 60; else if (aliasStart) s += 20;
  if (prefixUsed) s -= 15;
  return s - v.pen;
}
function parseQuery(raw) { var t = toks(raw); return t.length ? {raw: raw, t: t, V: variants(t), pre: !/\s$/.test(raw)} : null; }
function scoreCard(c, Q) { var best = 0; for (var i = 0; i < Q.V.length; i++) { var s = scoreVariant(c, Q.V[i], Q.pre); if (s > best) best = s; } return best; }
function search(raw) {
  var Q = parseQuery(raw); if (!Q) return [];
  var res = [];
  CARDS.forEach(function (c) { if (c.dup) return; var s = scoreCard(c, Q); if (s > 0) res.push({c: c, s: s}); });
  res.sort(function (a, b) { return b.s - a.s || a.c.tt.length - b.c.tt.length; });
  return res;
}
function hl(title, raw) {
  var qs = toks(raw).filter(function (w) { return !STOP[w] && w.length > 1; });
  if (!qs.length) return fmt(title);
  return fmt(title).split(/(<[^>]+>|&[a-z]+;)/).map(function (seg) {
    if (!seg || seg.charAt(0) === '<' || seg.charAt(0) === '&') return seg;
    return seg.replace(/[A-Za-z0-9#+]+/g, function (w) { var s = stem(norm(w).trim().split(' ')[0] || ''); return qs.some(function (q) { return s === q || (q.length >= 3 && s.indexOf(q) === 0); }) ? '<mark>' + w + '</mark>' : w; });
  }).join('');
}

/* ================= diagrams ================= */
var mid = 0, mermaidState = 0, mermaidQ = [];
function loadMermaid(cb) {
  if (mermaidState === 2) return cb(true);
  if (mermaidState === 3) return cb(false);
  mermaidQ.push(cb); if (mermaidState === 1) return; mermaidState = 1;
  var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  s.onload = function () { try { var dark = matchMedia('(prefers-color-scheme: dark)').matches; mermaid.initialize({startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict', flowchart: {htmlLabels: true, curve: 'basis'}}); mermaidState = 2; } catch (e) { mermaidState = 3; } mermaidQ.splice(0).forEach(function (f) { f(mermaidState === 2); }); };
  s.onerror = function () { mermaidState = 3; mermaidQ.splice(0).forEach(function (f) { f(false); }); };
  document.head.appendChild(s);
}
function diagramCode(p) {
  var L = ['flowchart ' + (p.direction === 'vertical' ? 'TB' : 'LR')];
  (p.nodes || []).forEach(function (n) {
    var lab = '<b>' + mesc(n.label) + '</b>' + (n.detail ? '<br/><small>' + mesc(n.detail) + '</small>' : ''), id = 'n_' + n.id.replace(/[^A-Za-z0-9_]/g, '_'), k = n.kind || 'box';
    if (k === 'decision') L.push(id + '{"' + lab + '"}'); else if (k === 'terminal') L.push(id + '(["' + lab + '"])'); else if (k === 'person') L.push(id + '(("' + lab + '"))'); else L.push(id + '["' + lab + '"]');
  });
  (p.edges || []).forEach(function (e) { L.push('n_' + e.from.replace(/[^A-Za-z0-9_]/g, '_') + ' ' + (e.dashed ? '-.->' : '-->') + (e.label ? '|"' + mesc(e.label) + '"|' : '') + ' n_' + e.to.replace(/[^A-Za-z0-9_]/g, '_')); });
  return L.join('\n');
}
function seqCode(p) {
  var L = ['sequenceDiagram'], ids = p.actors.map(function (a) { return a.id; });
  p.actors.forEach(function (a) { L.push('participant a_' + a.id + ' as ' + mesc(a.label)); });
  p.messages.forEach(function (m) {
    if (m.note !== undefined) L.push('Note over ' + (m.over ? 'a_' + m.over : ('a_' + ids[0] + ',a_' + ids[ids.length - 1])) + ': ' + mesc(m.note));
    else L.push('a_' + m.from + (m.reply ? '-->>' : '->>') + 'a_' + m.to + ': ' + mesc(m.label || ''));
  });
  return L.join('\n');
}
function visHTML(v) {
  if (!v) return '';
  var p = v.props || {};
  if (v.type === 'Table') {
    var h = '<table><thead><tr>' + p.columns.map(function (c) { return '<th>' + fmt(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    p.rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return c && typeof c === 'object' ? '<td class="' + (c.tone || '') + '">' + fmt(c.text) + '</td>' : '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; });
    return '<div class="vis">' + h + '</tbody></table></div>';
  }
  if (v.type === 'Steps') return '<div class="vis"><ol class="steps">' + p.steps.map(function (s) { return '<li><div class="t">' + fmt(s.title) + '</div>' + (s.detail ? '<div class="d">' + fmt(s.detail) + '</div>' : '') + '</li>'; }).join('') + '</ol></div>';
  if (v.type === 'Diagram' || v.type === 'Sequence') return '<div class="vis mermaid-box" data-code="' + esc(v.type === 'Diagram' ? diagramCode(p) : seqCode(p)) + '"><span class="count">Drawing diagram…</span></div>';
  if (v.type === 'ColumnSeries') {
    var cols = ['var(--accent)', '#eab308'], max = 0; p.series.forEach(function (s) { s.values.forEach(function (x) { if (x > max) max = x; }); });
    var h2 = '<div class="legend">' + p.series.map(function (s, i) { return '<span><i style="background:' + cols[i % 2] + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div><div class="bars">';
    p.labels.forEach(function (l, li) { h2 += '<div class="bargroup"><div class="lbl">' + esc(l) + '</div>'; p.series.forEach(function (s, i) { var val = s.values[li]; h2 += '<div class="barrow"><span class="nm">' + esc(s.name) + '</span><span class="bar" style="width:' + (val / max * 55) + '%;background:' + cols[i % 2] + '"></span><span>' + val + '</span></div>'; }); h2 += '</div>'; });
    return '<div class="vis">' + h2 + '</div></div>';
  }
  if (v.type === 'Pyramid') {
    var lv = [{y: 20, w: 200, l: 'End-to-end (Playwright, Cucumber)', n: 'few, slow', c: '#06b6d4'}, {y: 100, w: 400, l: 'Integration (API + DB)', n: 'some', c: '#eab308'}, {y: 180, w: 600, l: 'Unit (xUnit, NUnit, Moq, Jest)', n: 'many, fast', c: '#2563eb'}];
    var s = '<svg width="100%" viewBox="0 0 700 270" role="img" aria-label="Test pyramid">';
    lv.forEach(function (x) { s += '<rect x="' + (350 - x.w / 2) + '" y="' + x.y + '" width="' + x.w + '" height="64" rx="8" fill="' + x.c + '"/><text x="350" y="' + (x.y + 30) + '" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">' + esc(x.l) + '</text><text x="350" y="' + (x.y + 50) + '" text-anchor="middle" fill="#fff" font-size="12">' + esc(x.n) + '</text>'; });
    return '<div class="vis">' + s + '</svg></div>';
  }
  return '';
}
function renderMermaidIn(el) {
  var boxes = $$('.mermaid-box[data-code]', el); if (!boxes.length) return;
  loadMermaid(function (ok) {
    boxes.forEach(function (b) {
      var code = b.getAttribute('data-code'); if (code == null) return; b.removeAttribute('data-code');
      if (!ok) { b.parentNode.removeChild(b); return; }
      var id = 'mmd' + (++mid);
      mermaid.render(id, code).then(function (r) { b.innerHTML = r.svg; var sv = $('svg', b); if (sv) { sv.removeAttribute('height'); sv.style.maxWidth = '100%'; } })
        .catch(function () { if (b.parentNode) b.parentNode.removeChild(b); var j = document.getElementById('d' + id); if (j) j.remove(); });
    });
  });
}

/* ================= views ================= */
var inp, resEl, hintEl, searchV, ansV, lastQ = '', MAX = 40;
function renderResults() {
  var raw = inp.value;
  if (raw === lastQ && resEl.childNodes.length) return;
  lastQ = raw;
  if (!raw.trim()) { resEl.innerHTML = ''; hintEl.textContent = 'Type a question or a topic, then tap it to read the answer. Shaded text is also covered in a related answer.'; hintEl.hidden = false; return; }
  var r = search(raw).slice(0, MAX);
  hintEl.hidden = !!r.length; hintEl.textContent = r.length ? '' : 'No match. Try fewer or different words.';
  resEl.innerHTML = r.map(function (x) { return '<li><a href="#q/' + x.c.sl + '" data-id="' + x.c.id + '">' + hl(x.c.q, raw) + '</a></li>'; }).join('');
}
function loadAnswers() { if (!ansP) ansP = getJSON('data/answers.json').then(function (a) { ANS = a; return a; }); return ansP; }
function showSearch() {
  document.title = 'Interview answers';
  ansV.hidden = true; searchV.hidden = false;
  renderResults();
  if (matchMedia('(pointer: fine)').matches) inp.focus();
}
function showAnswer(c) {
  searchV.hidden = true; ansV.hidden = false;
  document.title = c.q;
  var body = $('#abody');
  $('#aq').innerHTML = fmt(c.q);
  body.innerHTML = '<p class="wait">Loading…</p>';
  window.scrollTo(0, 0);
  loadAnswers().then(function (A) {
    if (ansV.hidden || $('#aq').textContent !== c.q) return;
    var a = A[c.id]; if (!a) { body.innerHTML = '<p>Answer not found.</p>'; return; }
    body.innerHTML = a.s.map(function (p, i) { var r = a.m && a.m[i], whole = r && r.length === 1 && r[0][0] === 0 && r[0][1] >= p.length; return whole ? '<p class="also-p">' + fmt(p) + '</p>' : '<p>' + shaded(p, r) + '</p>'; }).join('') + (a.v ? visHTML(a.v) : '');
    renderMermaidIn(body);
  }).catch(function (e) { body.innerHTML = '<p>Could not load the answer. Check your connection and try again.</p>'; console.error(e); });
}
// passages also covered in another answer get a soft tint (full text stays in both)
function shaded(p, r) {
  if (!r || !r.length) return fmt(p);
  var out = '', at = 0;
  r.forEach(function (x) { out += fmt(p.slice(at, x[0])) + '<span class="also">' + fmt(p.slice(x[0], x[1])) + '</span>'; at = x[1]; });
  return out + fmt(p.slice(at));
}
var cameFromSearch = false;
function route() {
  var m = /^#q\/(.+)$/.exec(location.hash || '');
  if (m) {
    var slug = decodeURIComponent(m[1]), c = BYSLUG[slug] || BYID[slug];
    if (c && c.dup) c = BYID[c.dup];
    if (c) return showAnswer(c);
  }
  showSearch();
}
function back() { if (cameFromSearch) history.back(); else { location.hash = ''; } }

/* ================= init ================= */
function init(ix) {
  TOPIC = ix.topics; CARDS = ix.cards;
  CARDS.forEach(function (c) { BYID[c.id] = c; BYSLUG[c.sl] = c; AKA[c.id] = (c.a || []).map(function (t) { return {text: t}; }); });
  NDOC = CARDS.length; CARDS.forEach(indexCard);
  inp = $('#q'); resEl = $('#res'); hintEl = $('#hint'); searchV = $('#search'); ansV = $('#answer');
  inp.addEventListener('input', renderResults);
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var a = $('#res a'); if (a) { e.preventDefault(); a.click(); } } });
  resEl.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a'); if (a) { cameFromSearch = true; inp.blur(); } });
  $('#back').addEventListener('click', function (e) { e.preventDefault(); back(); });
  document.addEventListener('keydown', function (e) {
    if (!ansV.hidden && (e.key === 'Escape' || (e.key === 'Backspace' && e.target === document.body))) { e.preventDefault(); back(); }
    else if (ansV.hidden && e.key === '/' && document.activeElement !== inp) { e.preventDefault(); inp.focus(); }
  });
  // swipe right to go back
  var sx = null, sy = 0, st = 0;
  ansV.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, {passive: true});
  ansV.addEventListener('touchend', function (e) { if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy); sx = null; if (dx > 80 && dy < 60 && Date.now() - st < 700) back(); }, {passive: true});
  window.addEventListener('hashchange', function () { if (!/^#q\//.test(location.hash)) cameFromSearch = false; route(); });
  document.body.classList.remove('loading');
  route();
  setTimeout(loadAnswers, 300);
  window.__QA = {
    v: ix.v, cards: CARDS.filter(function (c) { return !c.dup; }).length, items: ix.items,
    titles: function () { return CARDS.map(function (c) { return {id: c.id, q: c.q, dup: c.dup, sl: c.sl}; }); },
    search: function (q) { return search(q).map(function (x) { return {id: x.c.id, q: x.c.q, s: Math.round(x.s)}; }); },
    answer: function (id) { return loadAnswers().then(function (A) { return A[id]; }); }
  };
}
getJSON('data/index.json').then(init).catch(function (e) { var h = $('#hint'); if (h) { h.hidden = false; h.textContent = 'Could not load the questions (' + e.message + '). Check your connection and refresh.'; } console.error(e); });
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.__SINGLE) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
