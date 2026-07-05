const CACHE_NAME = 'checklist-frota-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Evita cachear requisições da API do ImgBB
    if (e.request.url.includes('api.imgbb.com') || e.request.url.includes('i.ibb.co')) {
        return;
    }
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
