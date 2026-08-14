// Slideshow de rutas de autobús. Muestra una ruta a la vez (nombre,
// dirección y trazado vectorial) y pasa a la siguiente cada `intervalMs`.
// No depende de ningún mapa externo — el trazado ya viene pre-calculado
// en routes-data.js, así que funciona sin conexión a APIs de mapas.

import { ROUTES, ROUTES_VIEWBOX } from "./routes-data.js";

export function initRoutesSlideshow(container, { intervalMs = 4000 } = {}) {
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
        color: #eee;
        font-family: system-ui, sans-serif;
        position: relative;
        overflow: hidden;
      }
      .rs-header {
        position: absolute;
        top: 4%;
        left: 0;
        right: 0;
        text-align: center;
      }
      .rs-title {
        font-size: 1.6vw;
        font-weight: 700;
        letter-spacing: 0.02em;
        margin: 0;
      }
      .rs-subtitle {
        font-size: 1.1vw;
        color: #9aa0a6;
        margin: 0.3em 0 0;
      }
      .rs-count {
        position: absolute;
        bottom: 4%;
        right: 4%;
        font-size: 0.9vw;
        color: #666;
      }
      .rs-svg-wrap {
        width: 82%;
        height: 62%;
        opacity: 0;
        transition: opacity 0.6s ease;
      }
      .rs-svg-wrap.rs-visible {
        opacity: 1;
      }
      .rs-line {
        fill: none;
        stroke: #ff7a00;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .rs-dot-start { fill: #4caf50; }
      .rs-dot-end { fill: #e53935; }
    </style>
    <div class="rs-wrap">
      <div class="rs-header">
        <p class="rs-title" id="rs-title"></p>
        <p class="rs-subtitle" id="rs-subtitle"></p>
      </div>
      <div class="rs-svg-wrap" id="rs-svg-wrap">
        <svg viewBox="${ROUTES_VIEWBOX}" width="100%" height="100%" id="rs-svg"></svg>
      </div>
      <div class="rs-count" id="rs-count"></div>
    </div>
  `;

  const titleEl = container.querySelector("#rs-title");
  const subtitleEl = container.querySelector("#rs-subtitle");
  const svgWrapEl = container.querySelector("#rs-svg-wrap");
  const svgEl = container.querySelector("#rs-svg");
  const countEl = container.querySelector("#rs-count");

  let index = 0;

  function render(i) {
    const route = ROUTES[i];

    svgWrapEl.classList.remove("rs-visible");

    setTimeout(() => {
      titleEl.textContent = route.name;
      subtitleEl.textContent = route.subtitle;
      countEl.textContent = `Ruta ${i + 1} de ${ROUTES.length}`;

      svgEl.innerHTML = `
        <path class="rs-line" d="${route.path}" />
        <circle class="rs-dot-start" cx="${route.start[0]}" cy="${route.start[1]}" r="6" />
        <circle class="rs-dot-end" cx="${route.end[0]}" cy="${route.end[1]}" r="6" />
      `;

      svgWrapEl.classList.add("rs-visible");
    }, 300); // espera a que termine el fade-out antes de cambiar contenido
  }

  render(index);

  setInterval(() => {
    index = (index + 1) % ROUTES.length;
    render(index);
  }, intervalMs);
}
