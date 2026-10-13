import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const offlineVersion = String(Date.now());

export default defineConfig({
  define: { __OFFLINE_VERSION__: JSON.stringify(offlineVersion) },
  plugins: [react(), {
    name: 'offline-pocket-guide',
    generateBundle(_, bundle) {
      const files = ['index.html', 'icon.svg', 'manifest.webmanifest', ...Object.keys(bundle).filter(name => name !== 'index.html')];
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const VERSION = '${offlineVersion}';
const CACHE = 'london-pocket-' + new URL(self.registration.scope).pathname + '-' + VERSION;
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new URL(file, self.registration.scope).href))).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('london-pocket-' + new URL(self.registration.scope).pathname) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if (event.data === 'OFFLINE_VERSION') event.ports[0]?.postMessage(VERSION); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('index.html', self.registration.scope).href, { ignoreVary: true })));
  } else if (FILES.some(file => new URL(file, self.registration.scope).pathname === url.pathname)) {
    event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
  }
});
` });
    },
  }],
  base: '/interactive-london/',
});
