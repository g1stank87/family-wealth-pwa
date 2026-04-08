const CACHE_NAME = 'family-wealth-pwa-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/scripts/data-layer.js',
  '/scripts/router.js',
  '/scripts/app.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// 安装事件 - 容错处理，单个失败不中止整体
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          ASSETS.map(url =>
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) return cache.add(url);
              })
              .catch(err => console.warn('SW cache miss:', url, err))
          )
        ).then(() => self.skipWaiting());
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
