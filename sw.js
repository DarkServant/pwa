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
    '/',
    'manifest.json',
    '/icons/icon-512.png',
    '/style/main.css',
    '/js/graphics.js',
    '/js/gl-matrix-min.js',
    '/js/gl-matrix.js',
    '/js/socket.io.js',
    '/js/webgl-3d-math.js',
    '/js/webgl-utils.js',
    'images/galaxy.png',
    'images/0_layer_16_uniquemegaatlas.bmp',
    'images/1_layer_16_uniquemegaatlas.bmp',
    'images/2_layer_16_uniquemegaatlas.bmp',
    'images/3_layer_16_uniquemegaatlas.bmp',
    'images/4_layer_16_uniquemegaatlas.bmp',
    'images/5_layer_16_uniquemegaatlas.bmp',
    'images/6_layer_16_uniquemegaatlas.bmp',
    'images/7_layer_16_uniquemegaatlas.bmp',
    'images/8_layer_16_uniquemegaatlas.bmp',
    'Redmoon/DATAs/Map/Map00072.rmm',
    'Redmoon/RLEs/int.lst',
    'Redmoon/RLEs/bul.lst',
    'Redmoon/RLEs/tle.lst',
    'Redmoon/RLEs/snd.lst',
    'Redmoon/RLEs/obj.lst',
    'Redmoon/RLEs/ico.lst',
    'Redmoon/RLEs/Chr/etc.lst',
];

function paddy(n, p, c = '0') {
  return ('' + n).padStart(p, c);
}

for(var i=1;i<276;i++){
  var str = `Redmoon/DATAs/Tle/tle${paddy(i, 5)}.rmd`;
  URLS_TO_PRECACHE.push(str);
}

for(var i=0;i<10;i++){
  var str = `Redmoon/RLEs/Chr/c0${i}.lst`;
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