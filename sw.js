
const cacheName = "HLPWA-v-alpha-1.31";

const Testing = self.location.host.split(":")[0] == "localhost";
const Verbose = !Testing;

const appShellFiles = [
    '/index.html',
    '/app.js',
    '/page_master.js',
    '/page_search.js',
    '/page_bookentry.js',
    '/styles.css',
    '/favicon.png',
];

self.addEventListener('install', (e) => {
    if(Verbose) console.log('[Service Worker] Install');
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        if(Verbose) console.log('[Service Worker] Caching app shell');
        try{
            await cache.addAll(appShellFiles);
        } catch(err){
            if(Verbose) console.log("App failed to cache!");
            if(Verbose) console.error(err);
        }
    })());
});

self.addEventListener('message', (e) => {
    if(Verbose) console.log("[Service Worker] got a message", e);
    if(e.data && e.data.type === "SKIP_WAITING") return self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === cacheName) { return; }
            return caches.delete(key);
        }));
    }));
});

function fetchResource(request, save=true){
    return fetch(request).then(async response => {
        if(!save) return response;
        const cache = await caches.open(cacheName);
        if(Verbose) console.log(`[Service Worker] Caching new resource: ${request.url}`);
        cache.put(request, response.clone());
        return response;
    }).catch(err => {
        let init = navigator.onLine ? {status:404, statusText:"not found"} : {status:418, statusText:"offline"};
        return new Response("", init);
    });
}

self.addEventListener("fetch", (e) => {
    if(e.request.cache == "reload" || Testing){
        if(Verbose) console.log(`[Service Worker] Fetching requested resource: ${e.request.url}`);
        return e.respondWith(fetchResource(e.request, false));
    }

    e.respondWith(caches.match(e.request).then(cachedResponse => {
        if(Verbose) console.log(`[Service Worker] Loading cached resource: ${e.request.url}`);
        if(cachedResponse) return cachedResponse;
        //no cached response stored -> fetch and cache resource
        if(Verbose) console.log(`[Service Worker] Cached resource not found: ${e.request.url}\nFetching...`);
        return fetchResource(e.request);
    }));
})
