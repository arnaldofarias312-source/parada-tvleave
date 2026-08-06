// Sincroniza un <video> para que TODAS las pantallas que corren
// este script muestren exactamente el mismo frame al mismo tiempo.
//
// NO confiamos en el reloj del sistema operativo de cada dispositivo:
// distintas laptops/TV pueden tener el reloj desalineado por segundos
// (NTP poco frecuente, hora manual, drift de hardware). En vez de eso,
// calculamos un "offset" contra la hora del propio servidor (Vercel),
// el mismo truco que usa NTP — así todas las pantallas usan la MISMA
// hora de referencia sin importar qué tan desalineado esté su reloj.

async function getServerClockOffsetMs() {
  const start = performance.now();
  try {
    const res = await fetch(window.location.href, {
      method: "HEAD",
      cache: "no-store",
    });
    const serverNow = new Date(res.headers.get("date")).getTime();
    const roundTripMs = performance.now() - start;
    // Compensamos la mitad del round-trip, igual que NTP.
    const estimatedServerNow = serverNow + roundTripMs / 2;
    return estimatedServerNow - Date.now();
  } catch {
    return 0; // si falla la petición, seguimos con la hora local como respaldo
  }
}

export function initSync(video, t0 = 0) {
  let duration = null;
  let clockOffsetMs = 0;

  async function refreshClockOffset() {
    clockOffsetMs = await getServerClockOffsetMs();
    correctPosition(true);
  }

  function correctPosition(force = false) {
    if (!duration) return;

    const now = (Date.now() + clockOffsetMs) / 1000; // hora corregida
    const elapsed = now - t0;
    const target = elapsed % duration; // dónde DEBERÍA estar el video
    const diff = Math.abs(video.currentTime - target);

    // Al cargar (force) siempre salta a la posición exacta, para que una
    // pantalla que se refresca/reinicia quede sincronizada de inmediato.
    // Durante la reproducción solo corrige si el desvío supera 0.8s, para
    // no verse entrecortado ni con saltos.
    if (force || diff > 0.8) {
      video.currentTime = target;
    }
    if (video.paused) {
      video.play().catch(() => {
        // Si el navegador bloquea el autoplay, reintenta en el próximo tick.
      });
    }
  }

  video.addEventListener("loadedmetadata", () => {
    duration = video.duration;
    correctPosition(true);
  });

  // Calcula el offset contra el servidor de una vez al arrancar, y lo
  // recalibra cada 10 minutos por si el reloj local deriva con el tiempo.
  refreshClockOffset();
  setInterval(refreshClockOffset, 10 * 60 * 1000);

  // Revisa y corrige cada 5 segundos.
  setInterval(correctPosition, 5000);

  // Si la pestaña estuvo oculta/dormida y vuelve, corrige al instante.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) correctPosition(true);
  });
}
