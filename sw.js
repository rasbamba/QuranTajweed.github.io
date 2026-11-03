const SHELL = 'quran-learner-shell-v8';
const DATA = 'quran-learner-data-v8';
const AUDIO_CACHE = 'quran-learner-offline-audio-v1';
const AUDIO_HOST = 'cdn.islamic.network';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './quranpath.css', './quranpath.js'];
const API_HOSTS = new Set(['api.alquran.cloud', 'api.quran.com']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== DATA && key !== AUDIO_CACHE).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === AUDIO_HOST && /^\/quran\/audio\/64\/ar\.alafasy\/\d+\.mp3$/.test(url.pathname)) {
    event.respondWith(caches.open(AUDIO_CACHE).then(async (cache) => {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      return fetch(req);
    }).catch(() => fetch(req)));
    return;
  }
  if (API_HOSTS.has(url.hostname)) {
    event.respondWith(fetch(req).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(DATA).then((cache) => cache.put(req, copy)).catch(() => {}));
      }
      return response;
    }).catch(async () => (await caches.match(req)) || Response.error()));
    return;
  }
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Network-first for navigation, allowing GitHub Pages deployments to update promptly.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(SHELL).then((cache) => cache.put('./index.html', copy)).catch(() => {}));
      }
      return response;
    }).catch(async () => (await caches.match('./index.html')) || Response.error()));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(SHELL).then((cache) => cache.put(req, copy)).catch(() => {}));
    }
    return response;
  })));
});
