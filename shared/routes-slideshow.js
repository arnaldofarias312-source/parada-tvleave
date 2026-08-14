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
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.9);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
      }
      .rs-title {
        font-size: 1.4vw;
        font-weight: 700;
        margin: 0;
      }
      .rs-subtitle {
        font-size: 1vw;
        color: #555;
        margin: 0.3em 0 0;
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
        <p class="rs-subtitle" id="rs-subtitle"></p>
      </div>
      <div class="rs-count" id="rs-count"></div>
    </div>
  `;

  const titleEl = container.querySelector("#rs-title");
  const subtitleEl = container.querySelector("#rs-subtitle");
  const countEl = container.querySelector("#rs-count");
  const mapEl = container.querySelector("#rs-map");

  // Iniciar Leaflet
  const map = L.map(mapEl, {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    dragging: false,
    keyboard: false
  });

  // Capa base de OpenStreetMap clásica
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  let currentLayer = null;
  let index = 0;

  async function render(i) {
    const route = ROUTES[i];

    titleEl.textContent = route.name;
    subtitleEl.textContent = route.subtitle;
    countEl.textContent = \`Ruta \${i + 1} de \${ROUTES.length}\`;

    try {
      const response = await fetch(route.file);
      if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
      const geojsonData = await response.json();

      if (currentLayer) {
        map.removeLayer(currentLayer);
      }

      currentLayer = L.geoJSON(geojsonData, {
        style: function (feature) {
          return {
            color: route.color || "#ff7a00",
            weight: 5,
            opacity: 0.8
          };
        }
      }).addTo(map);

      // Centrar y ajustar el zoom dinámicamente al tamaño de la ruta
      map.fitBounds(currentLayer.getBounds(), { padding: [50, 50], maxZoom: 16 });

    } catch (error) {
      console.error("Error al cargar GeoJSON:", route.file, error);
    }
  }

  // Cargar primera ruta
  render(index);

  // Cambiar de ruta según el intervalo
  setInterval(() => {
    index = (index + 1) % ROUTES.length;
    render(index);
  }, intervalMs);
}
