const CACHE='nikah-app-5.5.0';
const ASSETS=['/','/index.html','/styles.css','/config.js','/i18n.js','/api.js','/app.js','/vendor/supabase.js','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/legal.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
   event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy));return res}).catch(()=>caches.match('/index.html')));
   return;
 }
 event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match(event.request)));
});
