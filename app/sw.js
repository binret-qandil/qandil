'use strict';
const SHELL='qandil-app-shell-v3';
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['./','index.html','data.js'])).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL&&k!=='qandil-pages-v1').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(new URL(e.request.url).pathname.endsWith('/data.js')){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(SHELL).then(c=>c.put('data.js',cl));}return r;}).catch(()=>caches.match('data.js')));return;}
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(SHELL).then(c=>c.put('index.html',cl));}return r;}).catch(()=>caches.match('index.html')));
  }
});
