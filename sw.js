self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating Service Worker ...', event);
    return self.clients.claim();
  });

  self.addEventListener('fetch', event => {
    console.log('[Service Worker] Fetching something ....', event);
  
    event.respondWith(
      
        caches.match(event.request)
            .then(response => {
                if (response) {
                  console.log('fetch request from CACHE: ', event.request);
                    console.log('fetch response from CACHE: ', response);
                    return response;
                }
  
                return fetch(event.request);
            })
    );
  });

const fafe =333;
const CACHE_STATIC_NAME = 'static';
var URLS_TO_PRECACHE = [
    '/pwa/',
    '/pwa/manifest.json',
    '/pwa/icons/icon-512.png',
    '/pwa/style/main.css',
    '/pwa/js/graphics.js',
    '/pwa/js/gl-matrix-min.js',
    '/pwa/js/gl-matrix.js',
    '/pwa/js/socket.io.js',
    '/pwa/js/webgl-3d-math.js',
    '/pwa/js/webgl-utils.js',
    '/pwa/images/galaxy.png',
    '/pwa/images/0_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/1_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/2_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/3_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/4_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/5_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/6_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/7_layer_16_uniquemegaatlas.bmp',
    '/pwa/images/8_layer_16_uniquemegaatlas.bmp',
    '/pwa/Redmoon/DATAs/Map/Map00072.rmm',
    '/pwa/Redmoon/RLEs/int.lst',
    '/pwa/Redmoon/RLEs/bul.lst',
    '/pwa/Redmoon/RLEs/tle.lst',
    '/pwa/Redmoon/RLEs/snd.lst',
    '/pwa/Redmoon/RLEs/obj.lst',
    '/pwa/Redmoon/RLEs/ico.lst',
    '/pwa/Redmoon/RLEs/Chr/etc.lst',
];

function paddy(n, p, c = '0') {
  return ('' + n).padStart(p, c);
}

for(var i=1;i<276;i++){
  var str = `/pwa/Redmoon/DATAs/Tle/tle${paddy(i, 5)}.rmd`;
  URLS_TO_PRECACHE.push(str);
}

for(var i=0;i<10;i++){
  var str = `/pwa/Redmoon/RLEs/Chr/c0${i}.lst`;
  URLS_TO_PRECACHE.push(str)
}

self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(cache => {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll(URLS_TO_PRECACHE);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting on install');
                return self.skipWaiting();
            })
    );
});

//cache first then network


addEventListener('backgroundfetchsuccess', event => {
  console.log('[Service Worker]: Background Fetch Success', event.registration);
  event.waitUntil(
    (async function() {
      try {
        // Iterating the records to populate the cache
        const cache = await caches.open(event.registration.id);
        const records = await event.registration.matchAll();
        const promises = records.map(async record => {
          const response = await record.responseReady;
          await cache.put(record.request, response);
        });
        await Promise.all(promises);
      } catch (err) {
        console.log('[Service Worker]: Caching error');
      }
    })()
  );
 });