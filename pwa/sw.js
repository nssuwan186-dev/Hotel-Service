const CACHE = 'hotel-cache-v1';
const ASSETS = [
  '../', '../index.html',
  '../assets/styles.css',
  '../assets/app.js',
  '../assets/utils.js',
  '../assets/ui.js',
  '../assets/bookings.js',
  '../assets/expenses.js',
  '../assets/reports.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).catch(() => res))
  );
});