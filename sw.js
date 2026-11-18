/* ENTREGA EPI SOLEMCCOR - servicio para uso sin conexión.
   Si se modifica el formulario, cambiar el número de VERSION para que los equipos se actualicen. */
var VERSION = 'entrega-epi-solemccor-v1';
var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.ico'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(VERSION).then(function(cache){ return cache.addAll(ARCHIVOS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.filter(function(c){ return c !== VERSION; }).map(function(c){ return caches.delete(c); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Con conexión se usa siempre la versión más reciente; sin conexión, la copia guardada.
self.addEventListener('fetch', function(event){
  var peticion = event.request;
  if(peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin){ return; }
  event.respondWith(
    fetch(peticion).then(function(respuesta){
      if(respuesta && respuesta.ok){
        var copia = respuesta.clone();
        caches.open(VERSION).then(function(cache){ cache.put(peticion, copia); });
      }
      return respuesta;
    }).catch(function(){
      return caches.match(peticion, { ignoreSearch: true }).then(function(guardada){
        return guardada || (peticion.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
