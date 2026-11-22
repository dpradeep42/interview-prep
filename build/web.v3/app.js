/* Interview Prep v3: vanilla JS, no backend. Data: data/core.json (+ data/d-pN.json loaded when a card opens). Progress in localStorage. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var V = window.__V || '';
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
function mesc(s) { return String(s).replace(/[#&<>";]/g, function (c) { return '#' + c.charCodeAt(0) + ';'; }); }
var store = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
function getJSON(p) {
  if (window.__INLINE && window.__INLINE[p]) return Promise.resolve(window.__INLINE[p]);
  return fetch(p + (V ? '?v=' + V : '')).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
}
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, 1800); }

var CORE, CARDS = [], BYID = {}, PARTS = [], PBY = {}, LIST = [], LBYID = {}, REV = {}, TOPIC = {}, DETAIL = {}, AKA = {};
var R = store.get('ip.r', {});            // ratings: id -> 'g' | 's' | 'm'
var SET = store.get('ip.set', {rate: 0.95, deep: false});
function rate(id, v) { if (R[id] === v) delete R[id]; else R[id] = v; store.set('ip.r', R); $$('[data-dot="' + id + '"]').forEach(function (d) { d.className = 'dot ' + (R[id] || ''); }); $$('.rate[data-for="' + id + '"] button').forEach(function (b) { b.classList.toggle('on', R[id] === b.getAttribute('data-r')); }); }
function idLabel(id) { var m = /^(\d+)f(\d+)$/.exec(id); return m ? ('Sec ' + m[1] + ' follow-up ' + m[2]) : ('#' + id); }
var DL = {B: 'Basic', I: 'Intermediate', A: 'Advanced'};
function secs(w) { return Math.round(w / 140 * 60); }   // calm interview pace, ~140 words per minute
function timeLbl(w) { var s = secs(w); if (s < 60) return '~' + s + ' s'; var m = Math.floor(s / 60), r = s % 60; return '~' + m + ' min' + (r >= 10 ? ' ' + r + ' s' : ''); }
function shortTime(w) { var s = secs(w); return s < 60 ? s + 's' : (Math.round(s / 6) / 10) + 'm'; }

/* ================= search ================= */
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
  var phraseA = false, aliasExact = false, aliasStart = false;
  c.al.forEach(function (a) {
    if (seqIdx(a.t, all, pre) >= 0) phraseA = true;
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
  if (!s) return 0;
  if (aliasExact) s += 60; else if (aliasStart) s += 20;
  if (prefixUsed) s -= 15;
  return s - v.pen;
}
function parseQuery(raw) { var t = toks(raw); return t.length ? {raw: raw, t: t, V: variants(t), pre: !/\s$/.test(raw)} : null; }
function scoreCard(c, Q) { var best = 0; for (var i = 0; i < Q.V.length; i++) { var s = scoreVariant(c, Q.V[i], Q.pre); if (s > best) best = s; } return best; }
function answerText(c) {
  var d = DETAIL[c.p] && DETAIL[c.p][c.id]; var s = c.s.join(' ') + ' ' + c.h;
  if (d) s += ' ' + d.a + ' ' + d.qa + ' ' + d.i.join(' ') + ' ' + d.f.map(function (f) { return f.join(' '); }).join(' ');
  return s;
}
function answerHit(c, Q) { if (!c._at) c._at = ' ' + toks(answerText(c)).join(' ') + ' '; var n = c._at, ct = Q.t.filter(function (w) { return !STOP[w]; }); if (!ct.length) ct = Q.t; return ct.every(function (w) { return n.indexOf(' ' + w + ' ') >= 0; }); }
function search(raw, scope) {
  var Q = parseQuery(raw); if (!Q) return [];
  var res = [];
  scope.forEach(function (c) { if (c.dup) return; var s = scoreCard(c, Q); if (s > 0) res.push({c: c, s: s}); });
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

/* ================= visuals ================= */
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
      if (!ok) { b.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px">' + esc(code) + '</pre>'; return; }
      var id = 'mmd' + (++mid);
      mermaid.render(id, code).then(function (r) { b.innerHTML = r.svg; var sv = $('svg', b); if (sv && sv.style.maxWidth) { sv.style.width = sv.style.maxWidth; sv.removeAttribute('height'); } })
        .catch(function () { b.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px">' + esc(code) + '</pre>'; var j = document.getElementById('d' + id); if (j) j.remove(); });
    });
  });
}

/* ================= read aloud ================= */
var TTS = {
  ok: 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined', btn: null,
  voice: function () { var vs = speechSynthesis.getVoices(); return vs.filter(function (v) { return /en-IN/i.test(v.lang); })[0] || vs.filter(function (v) { return /en-GB/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null; },
  stop: function () { if (!TTS.ok) return; try { speechSynthesis.cancel(); } catch (e) {} if (TTS.btn) { TTS.btn.classList.remove('on'); TTS.btn.textContent = TTS.btn.getAttribute('data-l') || '▶ Listen'; } TTS.btn = null; },
  speak: function (text, btn) {
    if (!TTS.ok) { toast('Read-aloud is not supported in this browser'); return; }
    var same = btn && TTS.btn === btn; TTS.stop(); if (same) return;
    var u = new SpeechSynthesisUtterance(String(text).replace(/[\[\]]/g, '').replace(/~/g, 'about ').replace(/->|→/g, ' to '));
    var v = TTS.voice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
    u.rate = SET.rate || 0.95;
    if (btn) { TTS.btn = btn; btn.setAttribute('data-l', btn.textContent); btn.classList.add('on'); btn.textContent = '■ Stop'; }
    u.onend = u.onerror = function () { if (btn && TTS.btn === btn) TTS.stop(); };
    speechSynthesis.speak(u);
  }
};
if (TTS.ok) try { speechSynthesis.getVoices(); } catch (e) { TTS.ok = false; }

/* ================= cards ================= */
function sayHTML(c) {
  return '<div class="say"><div class="sayhead"><span class="lbl">Say this</span><span class="time">' + timeLbl(c.w) + ' to say</span><span class="sp"></span>' +
    (TTS.ok ? '<button class="listen" type="button" data-say="' + c.id + '">▶ Listen</button>' : '') + '</div>' +
    c.s.map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join('') + '</div>';
}
function rateHTML(id) {
  return '<div class="rate" data-for="' + id + '"><span class="lbl">How did you do?</span>' +
    [['g', 'Got it'], ['s', 'Shaky'], ['m', 'Missed']].map(function (r) { return '<button type="button" class="' + r[0] + (R[id] === r[0] ? ' on' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>';
}
function bl(t) { var m = /^([A-Z][^:]{1,30}):\s(.*)$/.exec(t); return m ? '<b>' + fmt(m[1]) + ':</b> ' + fmt(m[2]) : fmt(t); }
function codeHTML(c) { return '<div class="code"><div class="codebar"><span>' + esc(c[0]) + '</span><button class="copy" type="button">Copy</button></div><pre><code>' + esc(c[1]) + '</code></pre></div>'; }
function akaList(c) { return AKA[c.id] || []; }
function bodyHTML(c) {
  var d = (DETAIL[c.p] || {})[c.id] || {}, h = sayHTML(c) + rateHTML(c.id);
  h += visHTML(d.vis);
  if (c.h) h += '<p class="hook"><b>Memory hook:</b> ' + fmt(c.h) + '</p>';
  h += '<details class="more"' + (SET.deep ? ' open' : '') + '><summary>More detail: quick answer, key points, deep dive, follow-ups</summary><div class="mbody">';
  if (d.qa) h += '<div class="quick"><div class="lbl">Quick answer (short version)</div><p>' + fmt(d.qa) + '</p></div>';
  if (d.a) h += '<h4 class="sec">Key points</h4><ul>' + d.a.split('|').map(function (b) { return '<li>' + bl(b) + '</li>'; }).join('') + '</ul>';
  var I = d.i || [], C = d.c || [], WV = d.wv || [];
  if (I.length || C.length || WV.length) {
    h += '<details class="impress"' + (SET.deep ? ' open' : '') + '><summary>Impress the interviewer</summary><div class="ibody">';
    if (I.length) h += '<ul>' + I.map(function (b) { return '<li>' + bl(b) + '</li>'; }).join('') + '</ul>';
    if (C.length) h += C.map(codeHTML).join('');
    if (WV.length) h += '<h4 class="sec">What this shows about me</h4><ul>' + WV.map(function (b) { return '<li>' + fmt(b) + '</li>'; }).join('') + '</ul>';
    h += '</div></details>';
  }
  var fus = []; if (d.fu) d.fu.split('||').forEach(function (f) { var p = f.split('::'); fus.push([p[0], p[1] || '']); });
  (d.f || []).forEach(function (f) { fus.push(f); });
  if (fus.length) h += '<div class="fu"><h4 class="sec">Likely follow-up questions</h4><ul>' + fus.map(function (p) { return '<li>' + fmt(p[0]) + '<div class="a">' + fmt(p[1]) + '</div></li>'; }).join('') + '</ul></div>';
  h += '</div></details>';
  var ak = akaList(c);
  if (ak.length) h += '<p class="onlist"><b>Also asked as:</b> ' + ak.map(function (a) { return esc(a.label) + ' ' + fmt(a.text); }).join(' · ') + '</p>';
  return h;
}
function cardHTML(c, o) {
  o = o || {};
  var ak = akaList(c), akaTxt = '';
  if (o.aka !== false && ak.length) akaTxt = '<span class="aka">Also asked as: ' + ak.slice(0, 2).map(function (a) { return esc(a.label) + ' ' + esc(a.text); }).join(' · ') + (ak.length > 2 ? ' · +' + (ak.length - 2) + ' more' : '') + '</span>';
  var title = o.raw ? hl(c.q, o.raw) : fmt(c.q);
  return '<details class="card' + (o.best ? ' best' : '') + '" data-id="' + c.id + '"><summary><span class="dot ' + (R[c.id] || '') + '" data-dot="' + c.id + '"></span>' +
    '<span class="q"><span class="num">' + (o.num || ('Q' + c.n)) + '</span>' + title + akaTxt + '</span><span class="tags">' +
    (o.best ? '<span class="tag best">Best match</span>' : '') + (o.rel ? '<span class="tag rel">related</span>' : '') +
    (o.where ? '<span class="tag">' + esc(o.where) + '</span>' : '') + (c.st ? '<span class="tag">Story</span>' : '') + (c.v ? '<span class="tag">Picture</span>' : '') +
    '<span class="tag ' + c.d + '">' + DL[c.d] + '</span><span class="tag" title="Time to say the answer">' + shortTime(c.w) + '</span></span></summary><div class="body"></div></details>';
}
function statusOfItem(it) { var rs = it.refs.map(function (r) { return R[r] || ''; }); if (rs.indexOf('m') >= 0) return 'm'; if (rs.indexOf('s') >= 0) return 's'; if (rs.length && rs.every(function (x) { return x === 'g'; })) return 'g'; return ''; }
function listItemHTML(it) {
  var parts = it.refs.map(function (r) { var c = BYID[r]; return c ? 'Part ' + c.p.slice(1) : ''; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  return '<details class="card" data-lid="' + esc(it.id) + '"><summary><span class="dot ' + statusOfItem(it) + '" data-ldot="' + esc(it.id) + '"></span><span class="q"><span class="num">' + esc(idLabel(it.id)) + '</span>' + fmt(it.text) + '</span>' +
    '<span class="tags"><span class="tag">' + esc(parts.join(', ')) + '</span></span></summary><div class="body"></div></details>';
}
function ensureDetail(p) {
  if (DETAIL[p]) return Promise.resolve(DETAIL[p]);
  return getJSON('data/d-' + p + '.json').then(function (d) { DETAIL[p] = d; return d; }).catch(function () { DETAIL[p] = DETAIL[p] || {}; return DETAIL[p]; });
}
function fillBody(det) {
  var b = det.querySelector(':scope > .body'); if (!b || b.getAttribute('data-done')) return Promise.resolve();
  b.setAttribute('data-done', '1');
  if (det.hasAttribute('data-id')) {
    var c = BYID[det.getAttribute('data-id')];
    b.innerHTML = sayHTML(c) + '<p class="count">Loading details…</p>';
    return ensureDetail(c.p).then(function () { b.innerHTML = bodyHTML(c); renderMermaidIn(b); });
  }
  var it = LBYID[det.getAttribute('data-lid')];
  var cs = it.refs.map(function (r) { return BYID[r]; }).filter(Boolean);
  return Promise.all(cs.map(function (c) { return ensureDetail(c.p); })).then(function () {
    b.innerHTML = cs.map(function (c) { return '<div class="ans"><div class="ansby">Answered by Part ' + c.p.slice(1) + ', Q' + c.n + ': <b>' + fmt(c.q) + '</b> <button class="jump" data-jump="' + c.id + '">Open in Part ' + c.p.slice(1) + '</button></div>' + bodyHTML(c) + '</div>'; }).join('');
    renderMermaidIn(b);
  });
}
document.addEventListener('toggle', function (ev) { var d = ev.target; if (d.tagName === 'DETAILS' && d.open && (d.hasAttribute('data-id') || d.hasAttribute('data-lid'))) fillBody(d); else if (d.tagName === 'DETAILS' && d.open) renderMermaidIn(d); }, true);
function refreshListDots() { $$('[data-ldot]').forEach(function (d) { var it = LBYID[d.getAttribute('data-ldot')]; if (it) d.className = 'dot ' + statusOfItem(it); }); }
document.addEventListener('click', function (ev) {
  var t = ev.target; if (!t.closest) return;
  var b = t.closest('.copy');
  if (b) { var txt = b.parentNode.parentNode.querySelector('code').textContent; var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done); else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); } return; }
  var l = t.closest('.listen'); if (l) { var c = BYID[l.getAttribute('data-say')]; if (c) TTS.speak(c.s.join(' '), l); else if (l.hasAttribute('data-text')) TTS.speak(l.getAttribute('data-text'), l); return; }
  var r = t.closest('.rate button'); if (r) { rate(r.parentNode.getAttribute('data-for'), r.getAttribute('data-r')); refreshListDots(); return; }
  var j = t.closest('.jump'); if (j) { ev.preventDefault(); openCard(j.getAttribute('data-jump')); return; }
  var go = t.closest('[data-go]'); if (go) { ev.preventDefault(); var g = go.getAttribute('data-go').split('|');
    if (g[0] === 'card') openCard(g[1]);
    else if (g[0] === 'topic') { state.part = g[1]; state.topic = g[2]; state.q = ''; $('#search').value = ''; buildTabs(); buildTopic(); setView('study'); }
    else if (g[0] === 'mock') startMockFrom(g[1]);
    return; }
});

/* ================= study view ================= */
var state = {part: 'list', topic: 'all', diff: 'all', q: '', pics: false, stories: false, inans: false, status: 'all'};
var LISTN = 0;
function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
function topicsFor(part) {
  if (part === 'list') return LIST.map(function (s) { return {k: 'list:' + s.n, label: s.n + '. ' + s.title, part: 'list', t: String(s.n)}; });
  var ps = part === 'all' ? PARTS : [PBY[part]];
  var o = []; ps.forEach(function (p) { p.topics.forEach(function (t) { o.push({k: p.key + ':' + t.t, label: t.label, part: p.key, t: t.t}); }); }); return o;
}
function buildTabs() {
  var opts = [{k: 'list', l: 'Your list (' + LISTN + ')'}].concat(PARTS.map(function (p) { return {k: p.key, l: p.label.replace(/^Part (\d+): /, 'P$1 · ').replace(/ \(.*\)$/, '') + ' (' + CARDS.filter(function (c) { return c.p === p.key; }).length + ')', full: p.label}; })).concat([{k: 'all', l: 'All (' + CARDS.length + ')'}]);
  $('#tabs').innerHTML = opts.map(function (o) { return '<button class="chip' + (o.k === state.part ? ' on' : '') + '" data-k="' + o.k + '" title="' + esc(o.full || o.l) + '" role="tab">' + esc(o.l) + '</button>'; }).join('');
  $$('#tabs .chip').forEach(function (b) { b.onclick = function () { state.part = b.getAttribute('data-k'); state.topic = 'all'; buildTabs(); buildTopic(); render(); history.replaceState(null, '', '#study/' + state.part); }; });
  var on = $('#tabs .chip.on'); if (on) { var tb = $('#tabs'); tb.scrollLeft = Math.max(0, on.offsetLeft - tb.clientWidth / 2 + on.clientWidth / 2); }
}
function buildTopic() { var s = $('#topic'); s.innerHTML = '<option value="all">All topics</option>' + topicsFor(state.part).map(function (g) { return '<option value="' + g.k + '">' + esc(g.label) + '</option>'; }).join(''); s.value = state.topic; if (s.value !== state.topic) { state.topic = 'all'; s.value = 'all'; } }
function buildDiff() { var o = [['all', 'All'], ['B', 'Basic'], ['I', 'Inter.'], ['A', 'Adv.']]; $('#diff').innerHTML = o.map(function (x) { return '<button data-k="' + x[0] + '" class="' + (state.diff === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join(''); $$('#diff button').forEach(function (b) { b.onclick = function () { state.diff = b.getAttribute('data-k'); buildDiff(); render(); }; }); }
function statusOK(r) { var s = state.status; if (s === 'all') return true; if (s === 'new') return !r; if (s === 'weak') return r === 's' || r === 'm'; return r === s; }
function cardOK(c) {
  if (state.diff !== 'all' && c.d !== state.diff) return false;
  if (state.pics && !c.v) return false; if (state.stories && !c.st) return false;
  return statusOK(R[c.id]);
}
function progressOf(cs) { var g = 0, s = 0, m = 0; cs.forEach(function (c) { var r = R[c.id]; if (r === 'g') g++; else if (r === 's') s++; else if (r === 'm') m++; }); return {g: g, s: s, m: m, n: cs.length}; }
function pbHTML(p, w) { var n = p.n || 1; return '<span class="pb" style="width:' + (w || 60) + 'px" title="' + p.g + ' got it, ' + p.s + ' shaky, ' + p.m + ' missed of ' + p.n + '"><i class="g" style="left:0;width:' + (p.g / n * 100) + '%"></i><i class="s" style="left:' + (p.g / n * 100) + '%;width:' + (p.s / n * 100) + '%"></i><i class="m" style="left:' + ((p.g + p.s) / n * 100) + '%;width:' + (p.m / n * 100) + '%"></i></span>'; }
function scopeCards() { return CARDS.filter(function (c) { return (state.part === 'list' || state.part === 'all' || c.p === state.part) && (state.topic === 'all' || state.part === 'list' || state.topic === c.p + ':' + c.t); }); }
function render() {
  var list = $('#list'), raw = state.q.trim();
  var P = PBY[state.part]; $('#partsum').textContent = P ? P.sum : state.part === 'list' ? 'Every question from your list, in your file’s order and numbering. Tap one to see the answer that covers it.' : 'All ten parts in one list.';
  if (raw) return renderSearch(raw);
  var html = '', toc = '', n = 0, tot = 0;
  if (state.part === 'list') {
    LIST.forEach(function (sec) {
      if (state.topic !== 'all' && state.topic !== 'list:' + sec.n) return;
      tot += sec.items.length;
      var its = sec.items.filter(function (it) { if (state.status === 'all') return true; return it.refs.some(function (r) { return statusOK(R[r]); }); });
      if (!its.length) return; n += its.length;
      var pr = progressOf(uniq(sec.items.reduce(function (a, it) { return a.concat(it.refs); }, [])).map(function (r) { return BYID[r]; }).filter(Boolean));
      html += '<h2 id="l-' + sec.n + '">' + sec.n + '. ' + esc(sec.title) + '</h2>' + its.map(listItemHTML).join('');
      toc += '<a href="#l-' + sec.n + '">' + sec.n + '. ' + esc(sec.title.length > 26 ? sec.title.slice(0, 25) + '…' : sec.title) + ' ' + pbHTML(pr, 34) + '</a>';
    });
    $('#count').textContent = 'Showing ' + n + ' of ' + tot + ' questions from your list.' + (state.status !== 'all' ? ' Filtered by practice status.' : '') + ' Dot colour = your rating: green got it, yellow shaky, red missed.';
  } else {
    topicsFor(state.part).forEach(function (g) {
      if (state.topic !== 'all' && state.topic !== g.k) return;
      var all = CARDS.filter(function (c) { return c.p === g.part && c.t === g.t; }); tot += all.length;
      var gi = all.filter(cardOK); if (!gi.length) return; n += gi.length;
      var gid = 'g-' + g.part + '-' + g.t, pr = progressOf(all);
      html += '<h2 id="' + gid + '">' + esc(g.label) + (state.part === 'all' ? ' <span class="muted small">Part ' + g.part.slice(1) + '</span>' : '') + ' <span class="muted small">' + pr.g + '/' + pr.n + ' got it</span> <button class="btn sm" data-go="mock|topic:' + g.part + ':' + g.t + '">Practise</button></h2>' + gi.map(function (c) { return cardHTML(c); }).join('');
      toc += '<a href="#' + gid + '">' + esc(g.label) + ' ' + pbHTML(pr, 34) + '</a>';
    });
    $('#count').textContent = 'Showing ' + n + ' of ' + tot + ' questions.';
  }
  list.innerHTML = html || '<p class="count">Nothing matches these filters.</p>';
  $('#toc').innerHTML = toc;
}
var NUMRE = /^#?(\d+(f\d+)?)$/i;
function renderSearch(raw) {
  var list = $('#list'), html = '';
  var m = NUMRE.exec(raw.replace(/\s+/g, '')), lit = m && LBYID[m[1].toLowerCase()];
  if (lit) html += '<h2>Your list ' + esc(idLabel(lit.id)) + '</h2>' + listItemHTML(lit);
  var scope = scopeCards();
  var res = lit ? [] : search(raw, scope).filter(function (r) { return cardOK(r.c); });
  var strong = res.filter(function (r) { return r.s >= 600; }), rel = res.filter(function (r) { return r.s < 600; });
  var where = function (c) { return state.part === 'all' || state.part === 'list' ? 'Part ' + c.p.slice(1) : ''; };
  if (strong.length) html += '<h2>Questions about “' + esc(raw) + '”</h2>' + strong.map(function (r, i) { return cardHTML(r.c, {best: i === 0, raw: raw, where: where(r.c)}); }).join('');
  if (rel.length) html += '<h2>' + (strong.length ? 'Related' : 'Closest matches') + '</h2>' + rel.slice(0, 40).map(function (r, i) { return cardHTML(r.c, {best: !strong.length && i === 0, rel: true, raw: raw, where: where(r.c)}); }).join('');
  var shown = {}; res.forEach(function (r) { shown[r.c.id] = 1; });
  var more = 0, ans = [], Q = lit ? null : parseQuery(raw);
  if (Q) scope.forEach(function (c) { if (shown[c.id] || c.dup || !cardOK(c)) return; if (answerHit(c, Q)) { more++; ans.push(c); } });
  if (state.inans && ans.length) html += '<h2>Mentioned inside answers</h2>' + ans.map(function (c) { return cardHTML(c, {where: where(c)}); }).join('');
  list.innerHTML = html || '<p class="count">No questions match “' + esc(raw) + '”. Try fewer words, or tick “Also search answers”.</p>';
  $('#toc').innerHTML = '';
  $('#count').textContent = lit ? 'Your list item ' + idLabel(lit.id) + '.' : strong.length + ' question' + (strong.length === 1 ? '' : 's') + ' match, best first' + (rel.length ? ', plus ' + Math.min(rel.length, 40) + ' related' : '') + '.' +
    (!state.inans && more ? ' ' + more + ' more mention it inside answers: tick “Also search answers” in Filters.' : '') + (state.part !== 'all' && state.part !== 'list' ? ' Searching ' + PBY[state.part].label.split(':')[0] + ' only; pick “All” or “Your list” to search everything.' : '');
}
function scrollToEl(d) { setTimeout(function () { var y = d.getBoundingClientRect().top + window.pageYOffset - (window.innerWidth > 700 ? 110 : 10); window.scrollTo(0, Math.max(0, y)); }, 30); }
function openCard(id) {
  var c = BYID[id]; if (!c) return;
  state.q = ''; $('#search').value = ''; state.part = c.p; state.topic = 'all'; state.status = 'all'; $('#status').value = 'all'; state.diff = 'all'; state.pics = state.stories = false; $('#pics').checked = $('#stories').checked = false; buildDiff();
  buildTabs(); buildTopic(); setView('study', true);
  var d = $('#list details[data-id="' + id + '"]'); if (d) { d.open = true; fillBody(d); scrollToEl(d); }
}
function openFromSearch(id) {
  hideSugg();
  var d = $('#list details[data-id="' + id + '"]');
  if (!d) return openCard(id);
  d.open = true; fillBody(d); scrollToEl(d);
}
/* type-ahead suggestions */
var suggIdx = -1, suggRes = [];
function hideSugg() { $('#sugg').classList.add('hidden'); suggIdx = -1; $('#search').setAttribute('aria-expanded', 'false'); }
function showSugg(raw) {
  var box = $('#sugg'); if (!raw.trim() || raw.trim().length < 2 || NUMRE.test(raw.trim())) return hideSugg();
  suggRes = search(raw, scopeCards()).slice(0, 6);
  if (!suggRes.length) return hideSugg();
  box.innerHTML = suggRes.map(function (r, i) { var c = r.c, ak = akaList(c).length; return '<div class="si' + (i === suggIdx ? ' on' : '') + '" role="option" data-i="' + i + '"><div class="st">' + hl(c.q, raw) + '</div><div class="sm">Part ' + c.p.slice(1) + ' · ' + esc(TOPIC[c.p + ':' + c.t] || '') + (ak ? ' · also asked ' + ak + ' other way' + (ak > 1 ? 's' : '') : '') + '</div></div>'; }).join('');
  box.classList.remove('hidden'); $('#search').setAttribute('aria-expanded', 'true');
  $$('.si', box).forEach(function (el) { el.onmousedown = function (e) { e.preventDefault(); pickSugg(+el.getAttribute('data-i')); }; });
}
function pickSugg(i) { var r = suggRes[i]; if (!r) return; clearTimeout(sT); state.q = $('#search').value; render(); openFromSearch(r.c.id); $('#search').blur(); }
var sT;
function onSearchInput() { var v = $('#search').value; clearTimeout(sT); sT = setTimeout(function () { state.q = v; suggIdx = -1; render(); showSugg(v); }, 110); }

/* ================= top 50 ================= */
function renderTop() {
  var cs = CORE.top.map(function (id) { return BYID[id]; }), pr = progressOf(cs);
  $('#view-top').innerHTML = '<div class="panel"><h2>Top 50 must-know</h2><p class="muted">The questions most likely to come up for a .NET backend role with your resume: intro and stories, C#, ASP.NET Core, DI, APIs, EF Core and SQL, microservices and messaging, AWS, security and MCP. Know these cold.</p>' +
    '<div class="row"><span>' + pbHTML(pr, 180) + '</span><span class="muted small">' + pr.g + ' got it · ' + pr.s + ' shaky · ' + pr.m + ' missed · ' + (pr.n - pr.g - pr.s - pr.m) + ' not yet</span></div>' +
    '<div class="row" style="margin-top:10px"><button class="btn pri" data-go="mock|top">Mock interview on these 50</button><button class="btn" data-go="mock|topweak">Only the ones not yet “got it”</button></div></div>' +
    cs.map(function (c, i) { return cardHTML(c, {num: (i + 1) + '.', where: 'Part ' + c.p.slice(1)}); }).join('');
}

/* ================= mock interview ================= */
var MS = null, MT = null;
var MSET = store.get('ip.mock', {src: 'top', count: 10, time: 90, speak: false});
function mockPool(src) {
  var a;
  if (src === 'top') a = CORE.top.map(function (id) { return BYID[id]; });
  else if (src === 'topweak') a = CORE.top.map(function (id) { return BYID[id]; }).filter(function (c) { return R[c.id] !== 'g'; });
  else if (src === 'weak') a = CARDS.filter(function (c) { return R[c.id] === 's' || R[c.id] === 'm'; });
  else if (src === 'new') a = CARDS.filter(function (c) { return !R[c.id] && !c.dup; });
  else if (src === 'all') a = CARDS.filter(function (c) { return !c.dup; });
  else if (src === 'stories') a = CARDS.filter(function (c) { return c.st || c.p + ':' + c.t === 'p3:intro' || c.p + ':' + c.t === 'p3:star' || c.p + ':' + c.t === 'p9:s33'; });
  else if (/^part:/.test(src)) a = CARDS.filter(function (c) { return c.p === src.slice(5) && !c.dup; });
  else if (/^topic:/.test(src)) { var p = src.split(':'); a = CARDS.filter(function (c) { return c.p === p[1] && c.t === p[2]; }); }
  else a = [];
  return a;
}
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function renderMockSetup(msg) {
  stopTimer(); MS = null;
  var opt = function (v, l) { return '<option value="' + v + '"' + (MSET.src === v ? ' selected' : '') + '>' + esc(l) + '</option>'; };
  var srcs = opt('top', 'Top 50 must-know') + opt('topweak', 'Top 50: not yet "got it"') + opt('weak', 'My weak ones (shaky + missed)') + opt('new', 'Not practised yet') + opt('stories', 'Intro, HR and STAR stories') + opt('all', 'Anything (all questions)');
  srcs += '<optgroup label="By part">' + PARTS.map(function (p) { return opt('part:' + p.key, p.label); }).join('') + '</optgroup>';
  PARTS.forEach(function (p) { srcs += '<optgroup label="' + esc(p.label.split(':')[0]) + ' topics">' + p.topics.map(function (t) { return opt('topic:' + p.key + ':' + t.t, t.label); }).join('') + '</optgroup>'; });
  var sel = function (id, vals, cur) { return '<select id="' + id + '">' + vals.map(function (v) { return '<option value="' + v[0] + '"' + (String(cur) === String(v[0]) ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select>'; };
  $('#view-mock').innerHTML = '<div class="mock"><div class="panel"><h2>Mock interview</h2><p class="muted">You see only the question, like in the room. Answer out loud before the timer runs out, then reveal the model answer and rate yourself. Ratings are saved on this device and feed the “Revise weak ones” filter.</p>' +
    (msg ? '<p class="small" style="color:var(--bad)">' + esc(msg) + '</p>' : '') +
    '<div class="row"><label class="field">Questions from<select id="msrc">' + srcs + '</select></label></div>' +
    '<div class="row" style="margin-top:8px"><label class="field">How many' + sel('mcount', [[5, '5'], [10, '10'], [15, '15'], [25, '25'], [0, 'All of them']], MSET.count) + '</label>' +
    '<label class="field">Time to answer' + sel('mtime', [[45, '45 seconds'], [60, '1 minute'], [90, '1.5 minutes'], [120, '2 minutes'], [0, 'No timer']], MSET.time) + '</label></div>' +
    '<label class="chk" style="margin-top:10px"><input type="checkbox" id="mspeak"' + (MSET.speak ? ' checked' : '') + '> Read each question aloud (interviewer voice)</label>' +
    '<div class="row" style="margin-top:12px"><button class="btn pri" id="mstart">Start mock interview</button><span class="muted small" id="mpool"></span></div>' +
    '<p class="small muted" style="margin-top:12px">Keys: <kbd>Space</kbd> reveal / next · <kbd>1</kbd> got it · <kbd>2</kbd> shaky · <kbd>3</kbd> missed · <kbd>←</kbd> <kbd>→</kbd> previous / next · <kbd>Esc</kbd> end. On a phone, swipe left to reveal or go next, right to go back.</p></div>' + mockHistoryHTML() + '</div>';
  var upd = function () { MSET.src = $('#msrc').value; MSET.count = +$('#mcount').value; MSET.time = +$('#mtime').value; MSET.speak = $('#mspeak').checked; store.set('ip.mock', MSET); $('#mpool').textContent = mockPool(MSET.src).length + ' questions in this set'; };
  ['msrc', 'mcount', 'mtime', 'mspeak'].forEach(function (id) { $('#' + id).onchange = upd; }); upd();
  $('#mstart').onclick = function () { upd(); startMock(); };
}
function mockHistoryHTML() {
  var h = store.get('ip.mh', []); if (!h.length) return '';
  return '<div class="panel"><h3 style="margin-top:0">Recent mocks</h3>' + h.slice(-5).reverse().map(function (x) { return '<div class="small">' + esc(new Date(x.t).toLocaleString()) + ' · ' + x.g + ' got it, ' + x.s + ' shaky, ' + x.m + ' missed of ' + x.n + '</div>'; }).join('') + '</div>';
}
function startMockFrom(src) { MSET.src = src; store.set('ip.mock', MSET); MS = null; setView('mock'); startMock(); }
function startMock() {
  var pool = shuffle(mockPool(MSET.src));
  if (!pool.length) return renderMockSetup(MSET.src === 'weak' ? 'You have no shaky or missed questions yet. Rate some answers first.' : 'No questions in that set.');
  if (MSET.count) pool = pool.slice(0, MSET.count);
  MS = {ids: pool.map(function (c) { return c.id; }), i: 0, rev: false, res: {}, left: 0, src: MSET.src};
  showMockQ();
}
function stopTimer() { if (MT) clearInterval(MT); MT = null; }
function showMockQ() {
  stopTimer(); TTS.stop();
  var c = BYID[MS.ids[MS.i]], n = MS.ids.length, done = Object.keys(MS.res).length;
  MS.rev = false; MS.left = MSET.time;
  $('#view-mock').innerHTML = '<div class="mock"><div class="mhead"><span class="small muted">Question ' + (MS.i + 1) + ' of ' + n + '</span><span class="pb prog"><i class="g" style="left:0;width:' + (done / n * 100) + '%"></i></span><span class="timer" id="mtimer"></span><button class="btn sm" id="mend">End</button></div>' +
    (MSET.time ? '<div class="tbar"><i id="mtbar" style="width:100%"></i></div>' : '') +
    '<div class="stage" id="stage"><div class="mmeta">' + esc(TOPIC[c.p + ':' + c.t] || '') + ' · ' + DL[c.d] + '</div><div class="mq" id="mq">' + fmt(c.q) + '</div>' +
    '<div id="mans"><p class="muted">Answer out loud now. Aim for about ' + timeLbl(c.w).replace('~', '') + ': definition, how it works, an example from your work, and a closing line.</p></div>' +
    '<div class="mact"><button class="btn" id="mprev"' + (MS.i ? '' : ' disabled') + '>‹ Previous</button><button class="btn pri" id="mrev">Reveal answer</button><button class="btn" id="mskip">Skip ›</button></div>' +
    '<div class="mhint" id="mhint">Swipe left to reveal, right to go back</div></div></div>';
  $('#mend').onclick = finishMock; $('#mrev').onclick = revealMock; $('#mskip').onclick = mockNext; $('#mprev').onclick = mockPrev;
  wireSwipe($('#stage'));
  if (MSET.time) { tick(); MT = setInterval(function () { MS.left--; tick(); if (MS.left <= 0) { stopTimer(); if (!MS.rev) { toast('Time’s up'); revealMock(); } } }, 1000); }
  if (MSET.speak) TTS.speak(c.q, null);
  window.scrollTo(0, 0);
}
function tick() { var t = $('#mtimer'); if (!t || !MS) return; var l = Math.max(0, MS.left); t.textContent = Math.floor(l / 60) + ':' + ('0' + (l % 60)).slice(-2); t.classList.toggle('low', l <= 10); var b = $('#mtbar'); if (b) b.style.width = (l / MSET.time * 100) + '%'; }
function revealMock() {
  if (!MS || MS.rev) return; MS.rev = true; stopTimer();
  var c = BYID[MS.ids[MS.i]], used = MSET.time ? MSET.time - MS.left : 0;
  $('#mans').innerHTML = sayHTML(c) + (c.h ? '<p class="hook"><b>Memory hook:</b> ' + fmt(c.h) + '</p>' : '') + (used ? '<p class="small muted">You used ' + used + ' s of ' + MSET.time + ' s.</p>' : '') +
    '<div class="small muted">How did you do?</div><div class="rbig">' + [['g', 'Got it', 1], ['s', 'Shaky', 2], ['m', 'Missed', 3]].map(function (r) { return '<button class="' + r[0] + (MS.res[c.id] === r[0] ? ' on' : '') + '" data-mr="' + r[0] + '">' + r[1] + ' <kbd>' + r[2] + '</kbd></button>'; }).join('') + '</div>' +
    '<p class="small" style="margin-top:10px"><a href="#" data-go="card|' + c.id + '">Open the full answer with key points and follow-ups</a></p>';
  $$('[data-mr]').forEach(function (b) { b.onclick = function () { mockRate(b.getAttribute('data-mr')); }; });
  $('#mrev').textContent = 'Next ›'; $('#mrev').onclick = mockNext;
  $('#mhint').textContent = 'Swipe left for next, right to go back';
}
function mockRate(v) { if (!MS) return; var id = MS.ids[MS.i]; MS.res[id] = v; R[id] = v; store.set('ip.r', R); $$('[data-mr]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mr') === v); }); var at = MS.i; setTimeout(function () { if (MS && MS.i === at) mockNext(); }, 300); }
function mockNext() { if (!MS) return; if (MS.i < MS.ids.length - 1) { MS.i++; showMockQ(); } else finishMock(); }
function mockPrev() { if (MS && MS.i > 0) { MS.i--; showMockQ(); } }
function finishMock() {
  stopTimer(); TTS.stop(); if (!MS) return renderMockSetup();
  var ids = MS.ids, g = 0, s = 0, m = 0; ids.forEach(function (id) { var r = MS.res[id]; if (r === 'g') g++; else if (r === 's') s++; else if (r === 'm') m++; });
  var h = store.get('ip.mh', []); h.push({t: Date.now(), src: MS.src, n: ids.length, g: g, s: s, m: m}); store.set('ip.mh', h.slice(-20));
  var weak = ids.filter(function (id) { return MS.res[id] === 's' || MS.res[id] === 'm'; }), skipped = ids.length - g - s - m;
  $('#view-mock').innerHTML = '<div class="mock"><div class="panel" id="msum"><h2>Mock finished</h2><div class="stats"><div class="stat"><b style="color:var(--good)">' + g + '</b>Got it</div><div class="stat"><b style="color:var(--warn)">' + s + '</b>Shaky</div><div class="stat"><b style="color:var(--bad)">' + m + '</b>Missed</div><div class="stat"><b>' + skipped + '</b>Skipped</div></div>' +
    (weak.length ? '<h3>Revise these</h3>' + weak.map(function (id) { return cardHTML(BYID[id], {where: 'Part ' + BYID[id].p.slice(1)}); }).join('') : '<p>Nothing to revise from this round.</p>') +
    '<div class="row" style="margin-top:12px">' + (weak.length ? '<button class="btn pri" id="mredo">Practise these ' + weak.length + ' again</button>' : '') + '<button class="btn" id="mnew">New mock</button></div></div></div>';
  MS = null;
  if ($('#mredo')) $('#mredo').onclick = function () { MS = {ids: shuffle(weak), i: 0, rev: false, res: {}, left: 0, src: 'retry'}; showMockQ(); };
  $('#mnew').onclick = function () { renderMockSetup(); };
}
function wireSwipe(el) {
  var x0 = null, y0 = 0;
  el.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive: true});
  el.addEventListener('touchend', function (e) {
    if (x0 == null) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
    if (dx < 0) { if (MS && !MS.rev) revealMock(); else mockNext(); } else mockPrev();
  }, {passive: true});
}

/* ================= revise ================= */
var RV = store.get('ip.rv', {scope: 'top'}), TIDX = {};
function renderRevise() {
  var tot = progressOf(CARDS.filter(function (c) { return !c.dup; }));
  var h = '<div class="panel"><h2>Your progress</h2><div class="row"><span>' + pbHTML(tot, 200) + '</span><span class="muted small">' + tot.g + ' got it · ' + tot.s + ' shaky · ' + tot.m + ' missed · ' + (tot.n - tot.g - tot.s - tot.m) + ' not yet, of ' + tot.n + '</span></div>' +
    '<p class="small muted">Tap a topic to study it. Rate answers with Got it / Shaky / Missed in any card or in Mock mode.</p>';
  PARTS.forEach(function (p) {
    var pp = progressOf(CARDS.filter(function (c) { return c.p === p.key; }));
    h += '<details class="hk"' + (p.key === 'p1' ? ' open' : '') + '><summary><span class="ht" style="flex:1">' + esc(p.label) + '</span>' + pbHTML(pp, 70) + '</summary>';
    p.topics.forEach(function (t) { var cs = CARDS.filter(function (c) { return c.p === p.key && c.t === t.t; }), pr = progressOf(cs); h += '<div class="prow" data-go="topic|' + p.key + '|' + p.key + ':' + t.t + '"><span>' + esc(t.label) + '</span>' + pbHTML(pr, 110) + '<span class="n">' + pr.g + '/' + pr.n + '</span></div>'; });
    h += '</details>';
  });
  h += '<div class="row" style="margin-top:12px"><button class="btn sm" id="rvreset">Reset all ratings</button></div></div>';
  h += '<div class="panel"><h2>Last-minute revision</h2><p class="muted small">Every question with its one-line memory hook, topic by topic. Tap a line to see the Say-this answer.</p><div class="seg" id="rvscope">' + [['top', 'Top 50'], ['weak', 'Weak ones'], ['all', 'Everything']].map(function (o) { return '<button data-k="' + o[0] + '" class="' + (RV.scope === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div><div id="rvlist"></div></div>';
  $('#view-revise').innerHTML = h;
  $$('#rvscope button').forEach(function (b) { b.onclick = function () { RV.scope = b.getAttribute('data-k'); store.set('ip.rv', RV); renderRevise(); }; });
  $('#rvreset').onclick = function () { if (confirm('Clear all your Got it / Shaky / Missed ratings on this device?')) { R = {}; store.set('ip.r', R); renderRevise(); } };
  var cs = RV.scope === 'top' ? CORE.top.map(function (id) { return BYID[id]; }) : RV.scope === 'weak' ? CARDS.filter(function (c) { return R[c.id] === 's' || R[c.id] === 'm'; }) : CARDS.filter(function (c) { return !c.dup; });
  var groups = {}, order = [];
  cs.forEach(function (c) { var k = c.p + ':' + c.t; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(c); });
  if (RV.scope !== 'top') order.sort(function (a, b) { return (TIDX[a] || 0) - (TIDX[b] || 0); });
  $('#rvlist').innerHTML = order.length ? order.map(function (k) { return '<h3>' + esc(TOPIC[k]) + '</h3>' + groups[k].map(function (c) { return '<details class="hk" data-hk="' + c.id + '"><summary><span class="dot ' + (R[c.id] || '') + '" data-dot="' + c.id + '"></span><span><span class="ht">' + fmt(c.q) + '</span><br><span class="hh">' + fmt(c.h || '') + '</span></span></summary></details>'; }).join(''); }).join('') : '<p class="muted">No weak ones yet. Run a mock interview or rate some answers.</p>';
  $$('#rvlist details.hk').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open && !d.getAttribute('data-f')) { d.setAttribute('data-f', 1); var c = BYID[d.getAttribute('data-hk')]; d.insertAdjacentHTML('beforeend', sayHTML(c) + rateHTML(c.id) + '<a href="#" class="small" data-go="card|' + c.id + '">Open full answer</a>'); } }); });
}

/* ================= interview-day kit ================= */
function renderKit() {
  var K = CORE.kit, words = K.pitch.script.join(' ').split(/\s+/).length;
  var kv = function (rows) { return '<div class="kv">' + rows.map(function (f) { return '<b>' + esc(f[0]) + '</b><span>' + fmt(f[1]) + '</span>'; }).join('') + '</div>'; };
  var h = '<div class="panel"><h2>2-minute pitch: “Tell me about yourself”</h2><p class="muted small">Learn the beats, not every word. ' + timeLbl(words).replace('~', 'About ') + ' at a calm pace.</p>' +
    '<h3>The beats</h3><ol class="beats">' + K.pitch.beats.map(function (b) { return '<li>' + fmt(b) + '</li>'; }).join('') + '</ol>' +
    '<div class="say"><div class="sayhead"><span class="lbl">Full script</span><span class="time">' + timeLbl(words) + ' to say</span><span class="sp"></span>' + (TTS.ok ? '<button class="listen" type="button" data-text="' + esc(K.pitch.script.join(' ')) + '">▶ Listen</button>' : '') + '</div>' + K.pitch.script.map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join('') + '</div>' +
    '<div class="row"><button class="btn pri" id="ptimer">Practise with a 2:00 timer</button><span class="timer" id="ptime"></span></div></div>';
  h += '<div class="panel"><h2>How to structure any answer</h2>' + kv(K.framework) + '</div>';
  h += '<div class="panel"><h2>Resume numbers to remember</h2>' + kv(K.numbers) + '</div>';
  h += '<div class="panel"><h2>Story facts: say the same numbers every time</h2><p class="muted small">Details in [brackets] are suggested. Change any of them to what really happened, but use the same number in every answer.</p>' + kv(K.facts) + '</div>';
  h += '<div class="panel"><h2>Questions to ask the interviewer</h2><p class="muted small">Pick two or three that the conversation has not already answered.</p>' + K.ask.map(function (g) { return '<h3>' + esc(g[0]) + '</h3><ul class="asklist">' + g[1].map(function (q) { return '<li>' + fmt(q) + '</li>'; }).join('') + '</ul>'; }).join('') + '</div>';
  h += '<div class="panel"><h2>Night before and on the day</h2><ul class="asklist">' + K.checklist.map(function (q) { return '<li>' + fmt(q) + '</li>'; }).join('') + '</ul></div>';
  h += '<div class="panel"><h2>Settings</h2><label class="field">Read-aloud speed<select id="srate">' + [[0.8, 'Slow'], [0.95, 'Normal'], [1.1, 'Fast']].map(function (r) { return '<option value="' + r[0] + '"' + (SET.rate == r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></label><p class="small muted">Version ' + esc(CORE.v) + (window.__SINGLE ? ' (single-file copy)' : '') + '. Works offline after the first visit. Your ratings stay on this device only.</p></div>';
  $('#view-kit').innerHTML = h;
  $('#srate').onchange = function (e) { SET.rate = +e.target.value; store.set('ip.set', SET); };
  var pt = null; $('#ptimer').onclick = function () { var b = this, left = 120; if (pt) { clearInterval(pt); pt = null; b.textContent = 'Practise with a 2:00 timer'; $('#ptime').textContent = ''; return; } b.textContent = 'Stop timer'; var f = function () { $('#ptime').textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2); $('#ptime').classList.toggle('low', left <= 15); }; f(); pt = setInterval(function () { left--; f(); if (left <= 0) { clearInterval(pt); pt = null; b.textContent = 'Practise with a 2:00 timer'; toast('Two minutes. Wrap up with why this role.'); } }, 1000); };
}

/* ================= views, keys ================= */
var view = '';
function setView(v, keepScroll) {
  if (view === 'mock' && v !== 'mock') stopTimer();
  TTS.stop(); view = v;
  $$('.view').forEach(function (s) { s.classList.toggle('hidden', s.id !== 'view-' + v); });
  $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
  if (v === 'top') renderTop(); else if (v === 'mock') { if (!MS) renderMockSetup(); } else if (v === 'revise') renderRevise(); else if (v === 'kit') renderKit(); else render();
  var hh = '#' + (v === 'study' ? 'study/' + state.part : v); if (location.hash !== hh) history.replaceState(null, '', hh);
  if (!keepScroll) window.scrollTo(0, 0);
}
function focusCard(dir) {
  var sums = $$('#list details.card > summary'); if (!sums.length) return;
  var i = sums.indexOf(document.activeElement); i = i < 0 ? (dir > 0 ? 0 : sums.length - 1) : Math.max(0, Math.min(sums.length - 1, i + dir));
  sums[i].focus(); sums[i].scrollIntoView({block: 'center'});
}
document.addEventListener('keydown', function (e) {
  var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'select' || tag === 'textarea';
  if (e.target.id === 'search') {
    var n = suggRes.length, open = !$('#sugg').classList.contains('hidden');
    if (e.key === 'ArrowDown' && open) { e.preventDefault(); suggIdx = (suggIdx + 1) % n; showSugg(e.target.value); }
    else if (e.key === 'ArrowUp' && open) { e.preventDefault(); suggIdx = (suggIdx - 1 + n) % n; showSugg(e.target.value); }
    else if (e.key === 'Enter') { e.preventDefault(); clearTimeout(sT); state.q = e.target.value; render(); if (open && suggRes.length) pickSugg(suggIdx < 0 ? 0 : suggIdx); else { var f = $('#list details.card'); if (f && f.getAttribute('data-id')) openFromSearch(f.getAttribute('data-id')); else if (f) { f.open = true; } e.target.blur(); } }
    else if (e.key === 'Escape') hideSugg();
    return;
  }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (view === 'mock' && MS) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!MS.rev) revealMock(); else mockNext(); }
    else if (MS.rev && (e.key === '1' || e.key === '2' || e.key === '3')) mockRate({1: 'g', 2: 's', 3: 'm'}[e.key]);
    else if (e.key === 'ArrowRight') { if (!MS.rev) revealMock(); else mockNext(); }
    else if (e.key === 'ArrowLeft') mockPrev();
    else if (e.key === 'Escape') finishMock();
    return;
  }
  if (view === 'study') {
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    else if (e.key === 'j') { e.preventDefault(); focusCard(1); }
    else if (e.key === 'k') { e.preventDefault(); focusCard(-1); }
    else if (e.key === '1' || e.key === '2' || e.key === '3') { var a = document.activeElement, det = a && a.parentNode; var id = det && det.getAttribute && det.getAttribute('data-id'); if (id) { rate(id, {1: 'g', 2: 's', 3: 'm'}[e.key]); refreshListDots(); } }
  }
});

/* ================= init ================= */
function init(core) {
  CORE = core; PARTS = core.parts; LIST = core.list;
  PARTS.forEach(function (p, pi) { PBY[p.key] = p; p.topics.forEach(function (t, i) { TOPIC[p.key + ':' + t.t] = t.label; TIDX[p.key + ':' + t.t] = pi * 100 + i; }); });
  LIST.forEach(function (s) { s.items.forEach(function (it) { LBYID[it.id] = it; LISTN++; it.refs.forEach(function (r) { (REV[r] = REV[r] || []).push(it.id); }); }); });
  CARDS = core.cards; CARDS.forEach(function (c) { BYID[c.id] = c; });
  // "also asked as": your list items mapped to this card (when worded differently) + merged duplicate cards
  CARDS.forEach(function (c) {
    var seen = {}; seen[toks(c.q).join(' ')] = 1;
    var a = (REV[c.id] || []).map(function (lid) { return {label: idLabel(lid), text: LBYID[lid].text}; });
    CARDS.forEach(function (o) { if (o.dup === c.id) { a.push({label: 'Part ' + o.p.slice(1) + ' Q' + o.n, text: o.q}); (REV[o.id] || []).forEach(function (lid) { a.push({label: idLabel(lid), text: LBYID[lid].text}); }); } });
    AKA[c.id] = a.filter(function (x) { var k = toks(x.text).join(' '); if (seen[k]) return false; seen[k] = 1; return true; });
  });
  NDOC = CARDS.length; CARDS.forEach(indexCard);
  $('#loading').classList.add('hidden');
  var s = $('#search');
  s.addEventListener('input', onSearchInput);
  s.addEventListener('focus', function () { if (s.value.trim()) showSugg(s.value); });
  s.addEventListener('blur', function () { setTimeout(hideSugg, 150); });
  $('#topic').onchange = function (e) { state.topic = e.target.value; render(); };
  $('#status').onchange = function (e) { state.status = e.target.value; render(); };
  $('#pics').onchange = function (e) { state.pics = e.target.checked; render(); };
  $('#stories').onchange = function (e) { state.stories = e.target.checked; render(); };
  $('#inans').onchange = function (e) { state.inans = e.target.checked; if (state.inans) Promise.all(PARTS.map(function (p) { return ensureDetail(p.key); })).then(function () { CARDS.forEach(function (c) { delete c._at; }); render(); }); else render(); };
  $('#deep').checked = !!SET.deep; $('#deep').onchange = function (e) { SET.deep = e.target.checked; store.set('ip.set', SET); $$('#list details.more, #list details.impress').forEach(function (d) { d.open = SET.deep; }); };
  $('#collapse').onclick = function () { $$('#list details.card').forEach(function (d) { d.open = false; }); };
  $('#ftoggle').onclick = function () { var f = $('#filters'); f.classList.toggle('open'); this.setAttribute('aria-expanded', String(f.classList.contains('open'))); };
  $$('#nav button').forEach(function (b) { b.onclick = function () { setView(b.getAttribute('data-v')); }; });
  var h = (location.hash || '').slice(1).split('/');
  if (h[0] === 'study' && h[1] && (h[1] === 'list' || h[1] === 'all' || PBY[h[1]])) state.part = h[1];
  else if (h[0] && (PBY[h[0]] || h[0] === 'all')) state.part = h[0];
  buildTabs(); buildTopic(); buildDiff();
  setView(['top', 'mock', 'revise', 'kit'].indexOf(h[0]) >= 0 ? h[0] : 'study');
  window.__QA = {titles: function () { return CARDS.map(function (c) { return {id: c.id, q: c.q, dup: c.dup}; }); }, cards: CARDS.length, list: LISTN, v: CORE.v, openCard: openCard,
    search: function (q, part) { var save = state.part, st = state.topic; state.part = part || 'all'; state.topic = 'all'; var r = search(q, scopeCards()).map(function (x) { return {id: x.c.id, q: x.c.q, s: Math.round(x.s)}; }); state.part = save; state.topic = st; return r; }};
}
getJSON('data/core.json').then(init).catch(function (e) { $('#loading').textContent = 'Could not load the questions (' + e.message + '). Check your connection and refresh.'; console.error(e); });
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.__SINGLE) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
