const CACHE="ward13-prototype-v3";
const SHELL=["./","./index.html","./play.html","./style.css?v=3","./game.js?v=3","./hauntings.js?v=3","./monsters.js?v=3"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    const fetched=await Promise.allSettled(SHELL.map(async url=>{try{const response=await fetch(url,{cache:"reload"});if(response.ok)await cache.put(url,response)}catch(e){}}));
    return fetched;
  }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("ward13-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const isGameAsset=url.origin===self.location.origin&&url.pathname.includes("/WARD13/");
  if(!isGameAsset){
    // Cache-first for the third-party Three.js module, for offline sessions after first use.
    event.respondWith(caches.match(event.request).then(saved=>saved||fetch(event.request).then(response=>{if(response.ok||response.type==="opaque")caches.open(CACHE).then(c=>c.put(event.request,response.clone())).catch(()=>{});return response})));
    return;
  }
  // Network-first avoids showing obsolete characters when the GitHub Pages game gets updated.
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,clone)).catch(()=>{}))}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);if(cached)return cached;
    if(event.request.mode==="navigate")return caches.match("./play.html")||caches.match("./index.html");
    return Response.error();
  }));
});