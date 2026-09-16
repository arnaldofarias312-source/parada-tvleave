import { ROUTES } from "./routes-data.js";

export function initRoutesSlideshow(container, { intervalMs = 7000 } = {}) {
  container.innerHTML = `
    <style>
      .rs-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0d0d10;
        color: #111;
        font-family: system-ui, sans-serif;
        position: relative;
        overflow: hidden;
      }
      .rs-map-wrap {
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.6s ease;
      }
      .rs-map-wrap.rs-visible {
        opacity: 1;
      }
      .rs-header-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(255, 255, 255, 0.9);
        padding: 12px 20px;
        border-radius: 0 0 8px 0;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
      }
      .rs-title {
        font-size: 1.1vw;
        font-weight: 700;
        margin: 0;
      }
      .rs-count {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.9vw;
        color: #333;
        z-index: 1000;
      }
      /* Ocultar controles del mapa que no se necesitan en un slideshow */
      .leaflet-control-zoom, .leaflet-control-attribution {
        display: none !important;
      }
    </style>
    <div class="rs-wrap">
      <div id="rs-map" class="rs-map-wrap rs-visible"></div>
      <div class="rs-header-overlay">
        <p class="rs-title" id="rs-title"></p>
      </div>
      <div class="rs-count" id="rs-count"></div>
    </div>
  `;

  const titleEl = container.querySelector("#rs-title");
  const countEl = container.querySelector("#rs-count");
  const mapEl = container.querySelector("#rs-map");

  // Iniciar Leaflet optimizado para Smart TV (sin animaciones pesadas que saturen la CPU)
  const map = L.map(mapEl, {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    dragging: false,
    keyboard: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false
  });

  // Usar OpenStreetMap estándar — el SW cachea los tiles tras la primera carga
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: ""
  }).addTo(map);

  let currentLayer = null;
  let index = 0;

  // ─── CACHÉ EN MEMORIA ────────────────────────────────────────────────────
  // Precargamos todos los GeoJSON al arrancar. A partir de ese momento,
  // el slideshow ya no necesita red aunque el internet se corte.
  const geojsonCache = new Array(ROUTES.length).fill(null);

  async function preloadAll() {
    const promises = ROUTES.map(async (route, i) => {
      try {
        const res = await fetch(route.file);
        if (res.ok) geojsonCache[i] = await res.json();
      } catch {
        // Si falla la precarga, se intentará de nuevo al renderizar esa ruta
      }
    });
    await Promise.allSettled(promises);
  }

  async function getGeojson(i) {
    // Si ya está en memoria, úsalo directamente (no toca la red)
    if (geojsonCache[i]) return geojsonCache[i];
    // Si no (ej. falló la precarga), intenta de nuevo
    const res = await fetch(ROUTES[i].file);
    if (res.ok) {
      geojsonCache[i] = await res.json();
      return geojsonCache[i];
    }
    throw new Error(`No se pudo cargar ruta ${i}`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  async function render(i) {
    const route = ROUTES[i];
    titleEl.textContent = route.name;
    countEl.textContent = `Ruta ${i + 1} de ${ROUTES.length}`;

    try {
      const geojsonData = await getGeojson(i);

      if (currentLayer) {
        map.removeLayer(currentLayer);
      }

      currentLayer = L.geoJSON(geojsonData, {
        style: () => ({
          color: route.color || "#ff7a00",
          weight: 5,
          opacity: 0.8
        })
      }).addTo(map);

      // Salto instantáneo sin animación para no competir con el decodificador de video
      map.fitBounds(currentLayer.getBounds(), { padding: [20, 20], maxZoom: 18, animate: false });

    } catch (error) {
      console.warn("Ruta no disponible:", route.file, error);
    }
  }

  // Inicia: primero precarga todo, luego arranca el slideshow
  preloadAll().then(() => {
    render(index);
    setInterval(() => {
      index = (index + 1) % ROUTES.length;
      render(index);
    }, intervalMs);
  });
}
