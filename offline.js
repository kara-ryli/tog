const cacheVersion = 1;
const cachePrefix = 'tog-';
const files = [
  './apple-touch-icon.html',
  './apple-touch-icon.png',
  './fonts/HankenGrotesk/HankenGrotesk-Italic-VariableFont_wght.ttf',
  './fonts/HankenGrotesk/HankenGrotesk-VariableFont_wght.ttf',
  './fonts/TheNautigal/TheNautigal-Bold.ttf',
  './fonts/TheNautigal/TheNautigal-Regular.ttf',
  './icon.png',
  './',
  './index.html',
  './offline.js',
  './tog.css',
  './tog.js'
];
const cacheName = `${cachePrefix}${cacheVersion}`;

async function cacheFiles() {
  // Download new files
  const cacheStorage = await caches.open(cacheName);
  await Promise.allSettled(
    files.map((file) => cacheStorage.add(file).then(() => {
      console.info(`Cache success for file ${file}`);
    }, (error) => {
      console.error(`Cache failed for file ${file}`, error);
      throw error;
    }))
  );

  // Delete any old caches
  const keys = await caches.keys();
  for (const key of keys) {
    const isOurCache = key.startsWith(cachePrefix);
    if (isOurCache && !key == cacheName) {
      console.info(`deleting cache ${key}`);
      caches.delete(key);
    }
  }
}

async function fetchLive(request) {
  try {
    const result = await fetch(request);
    console.info('received live result', request.url);
    return result;
  }
  catch (fetchError) {
    console.info('live fetch failed', request.url, fetchError);
    throw fetchError;
  }
}

function raceWithCached(request, cached) {
  const timeout = 300;
  return Promise.race(
    fetchLive(request),
    new Promise(
      (res) => setTimeout(
        () => {
          console.info('using cached backup', request.url)
          res(cached);
        }
      ), timeout)
  );
}

async function fallBackToCached(request) {
  let cachedResponse;
  // try to fetch from cache
  try {
    const cache = await caches.open(cacheName);
    cachedResponse = await cache.match(request);
    console.info('cache hit', request.url);
  } catch(cacheError) {
    console.info('cache miss', request.url, cacheError);
  }
  // if we have cached response, don't wait long for
  // live data
  return cachedResponse ?
    raceWithCached(request, cachedResponse) :
    fetchLive(request);
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheFiles());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(fallBackToCached(event.request));
});
