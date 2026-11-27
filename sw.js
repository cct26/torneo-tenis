// Service worker: permite instalar la página como app y abrirla aunque falle la señal.
// Siempre intenta traer la versión más nueva; si no hay conexión usa la última guardada.
const CACHE = 'torneo-v2';
const BASE = ['./', 'index.html', 'admin.html', 'app.js', 'config.js', 'juego.html', 'icon-192.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r, { cache: 'no-cache' }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true })
        .then(m => m || (r.mode === 'navigate' ? caches.match('./') : undefined))
        .then(m => m || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
    );
    return;
  }
  // Fuentes y librerías externas: primero lo guardado, si no, de internet
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$|^cdn\.jsdelivr\.net$|^cdnjs\.cloudflare\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    })));
  }
});

// Notificaciones push de avisos
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  const opts = { body: d.body || '', icon: 'icon-192.png', tag: d.tag || 'aviso', renotify: true, data: { url: d.url || './#avisos' } };
  if (d.image) opts.image = d.image;
  e.waitUntil(self.registration.showNotification(d.title || 'Aviso del torneo', opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.url) || './#avisos', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
        const u = c.url.split('#')[0] + '#avisos';
        return c.focus().then(w => (w && w.navigate ? w.navigate(u) : w)).catch(() => {});
      }
    }
    return clients.openWindow(destino);
  }));
});
