// Service Worker — parada-tv
// Cachea todos los archivos estáticos y el video para que el sistema
// funcione sin internet después de la primera carga.

const CACHE_NAME = "parada-tv-v4";

const STATIC_ASSETS = [
  "/panel/",
  "/panel/index.html",
  "/publicidad/",
  "/publicidad/index.html",
  "/shared/config.js",
  "/shared/sync.js",
  "/shared/routes-data.js",
  "/shared/routes-slideshow.js",
  "/shared/controller-sync.js",
  "/api/time",
  // GeoJSON de las 19 rutas
  "/shared/geojson/Asociaci%C3%B3n%20Civil%20Conductores%20Guaya%20Lirio(%20mercado%20-parada%20de%20espera%20).geojson",
  "/shared/geojson/Asociaci%C3%B3n%20Civil%20Conductores%20Guaya%20Lirio(CENTRO%20-%20MERCADO-%20GUAYACAN-LIRIO).geojson",
  "/shared/geojson/Asociaci%C3%B3n%20Civil%20Uni%C3%B3n%20Conductores%20Propietarios%20Guaya%20%E2%80%93%20Muco%20(MERCADO%20-%20MUCO).geojson",
  "/shared/geojson/CANCHUNCHU-1MAYO-CENTRO%20-%20MERCADO.geojson",
  "/shared/geojson/CEIBAS-%20CENTRO-%20MERCADO.geojson",
  "/shared/geojson/CENTRO-MERCADO.%20PATILLA.geojson",
  "/shared/geojson/CENTRO-SAN%20MARTIN-TACOA-%20MOLINOS%20-MERCADO%20.geojson",
  "/shared/geojson/CHARCAL%20-%20CENTRO%20-%20MERCADO.geojson",
  "/shared/geojson/LINEA%20GUAYA-MUCO%20(MUCO%20-%20MERCADO).geojson",
  "/shared/geojson/MECADO-CENTRO-MOLINOS-SAN%20MARTIN.geojson",
  "/shared/geojson/MERCADO-CENTRO-1DE%20MAYO-CANCHUNCHU.geojson",
  "/shared/geojson/MERCADO-CENTRO-CEIBA.geojson",
  "/shared/geojson/MERCADO-CENTRO-CHARCAL.geojson",
  "/shared/geojson/Uni%C3%B3n%20Conductores%2024%20de%20Julio%20Charallave(CENTRO).geojson",
  "/shared/geojson/Uni%C3%B3n%20Conductores%2024%20de%20Julio%20Charallave(MERCADO).geojson",
  "/shared/geojson/Uni%C3%B3n%20de%20Conductores%20Guayac%C3%A1n%20de%20las%20Flores(Centro-Guayacan).geojson",
  "/shared/geojson/Uni%C3%B3n%20de%20Conductores%20Guayac%C3%A1n%20de%20las%20Flores(Guayacan-centro-mercado).geojson",
  "/shared/geojson/Uni%C3%B3n%20de%20Conductores%20Guayac%C3%A1n%20de%20las%20Flores(MERCADO-GUAYACAN).geojson",
  "/shared/geojson/map%20(SAN%20JOSE).geojson",
];

// Al instalar: cacheamos todos los archivos estáticos
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {})
        )
      );
    })
  );
});

// Al activar: limpiar cachés viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Al interceptar requests: estrategia Network-first con caída a caché
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ⚠️ Si la URL trae ?_r= (recarga forzada con cache-busting),
  // dejamos que vaya SIEMPRE a red, sin pasar por el SW.
  if (url.searchParams.has("_r")) {
    return;
  }

  // El video y audio de Supabase → Cache-first
  if (
    url.hostname.includes("supabase.co") &&
    (url.pathname.endsWith(".mp4") || url.pathname.endsWith(".mp3"))
  ) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // Los tiles de OpenStreetMap → Cache-first (mapas sin red)
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("basemaps.cartocdn.com")
  ) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // El resto (archivos propios del proyecto) → Network-first, caché como respaldo
  event.respondWith(networkFirstStrategy(event.request));
});

// Estrategia Network-first
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

// Estrategia Cache-first
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}