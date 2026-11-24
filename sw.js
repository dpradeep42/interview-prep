// Offline cache for Interview Prep. Version e43170bdbf
var CACHE = 'ip-e43170bdbf';
var FILES = ["./","index.html","app.css?v=e43170bdbf","app.js?v=e43170bdbf","data/index.json?v=e43170bdbf","data/answers.json?v=e43170bdbf"];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('ip-') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.hostname === 'cdn.jsdelivr.net') { // cache-first for the diagram library
    e.respondWith(caches.open(CACHE).then(function (c) { return c.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { if (r.ok) c.put(req, r.clone()); return r; }); }); }));
    return;
  }
  if (url.origin !== location.origin) return;
  // network first so new versions show up; cache as fallback when offline
  e.respondWith(fetch(req).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); } return r; })
    .catch(function () { return caches.match(req, {ignoreSearch: req.mode === 'navigate'}).then(function (hit) { return hit || caches.match('index.html'); }); }));
});
