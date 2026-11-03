// Service worker: offline app shell, cached Quran text, and downloaded audio.
// Bump VERSION when you change the app shell (index.html, icons, manifest).
const VERSION = 'v5';
const SHELL = 'qapp-shell-' + VERSION;
const DATA = 'qapp-data-' + VERSION;
const AUDIO = 'qapp-audio-v1';          // not versioned: downloads survive app updates
const KEEP = [SHELL, DATA, AUDIO];
const SHELL_FILES = ['./', './index.html', './quranpath.css', './quranpath.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const API_HOSTS = ['api.alquran.cloud', 'api.quran.com'];
const AUDIO_HOSTS = ['cdn.islamic.network'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve a saved audio file, honouring Range requests so the player can seek.
async function serveAudio(req, hit) {
  const range = req.headers.get('range');
  if (!range || hit.type === 'opaque') return hit;
  const buf = await hit.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return new Response(buf, { headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
  let start, end;
  if (m[1] === '' && m[2] !== '') { start = Math.max(0, size - (+m[2])); end = size - 1; }
  else { start = +m[1]; end = m[2] !== '' ? Math.min(+m[2], size - 1) : size - 1; }
  if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Recitation audio: use the downloaded copy if we have it, otherwise the network.
  if (req.destination === 'audio' || AUDIO_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(AUDIO)
        .then((cache) => cache.match(req.url))
        .then((hit) => (hit ? serveAudio(req, hit) : fetch(req)))
        .catch(() => fetch(req))
    );
    return;
  }

  // Quran text and translation: network first, last saved copy when offline.
  if (API_HOSTS.includes(url.hostname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Pages: network first so updates appear quickly; saved copy when offline.
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isPage) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Icons, manifest and other app files: cache first.
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
