const CACHE_NAME='evergrove-pages-v0.14.0';
const PREFIX='evergrove-pages-';
const ESSENTIAL=['./','./index.html','./web-updater.js', './viewport-v0.6.css','./readability-v0.8.css', './controls-v0.8.js','./evergrove_navigation_v012.js','./expansion-v014.js','./world-grid-v014.js','./world-atlas-v014.js','./world-atlas-v014.css','./maps/worlds.json','./map-editor.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ESSENTIAL))));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(n=>n.startsWith(PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const req=e.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
if(req.mode==='navigate'){e.respondWith((async()=>{try{const res=await fetch(req,{cache:'no-store'});if(res.ok)(await caches.open(CACHE_NAME)).put('./index.html',res.clone());return res;}catch{ return (await (await caches.open(CACHE_NAME)).match('./index.html'))||Response.error();}})());return;}
e.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;const res=await fetch(req);if(res.ok)(await caches.open(CACHE_NAME)).put(req,res.clone());return res;})());});