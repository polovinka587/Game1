// Название кеша
const CACHE_NAME = 'color-reactor-v1';

// Файлы для кеширования
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/game.js',
    '/manifest.json',
    '/icons/icon-72.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Установка Service Worker и кеширование файлов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кешируем файлы');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация и очистка старых кешей
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('Удаляем старый кеш:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов и отдача из кеша
self.addEventListener('fetch', event => {
    // Пропускаем запросы к внешним ресурсам
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Клонируем ответ, так как он может быть использован только один раз
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch(() => {
                // Fallback для страниц
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});
