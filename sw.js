// Hitta på! — minimal cache-first service worker (~30 rader).
// ENDAST för https-hemskärmsinstallation. Appen är 100 % funktionell utan denna
// fil (via file:// är lagret dött). Inga externa anrop; endast appens egna filer.
"use strict";

var CACHE = "famapp-v1";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      // Cache-first. Vid nät: revalidera cachen i bakgrunden (stale-while-revalidate).
      var nät = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var kopia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, kopia); });
        }
        return res;
      }).catch(function () { return hit || caches.match("./index.html"); });
      return hit || nät;
    })
  );
});
