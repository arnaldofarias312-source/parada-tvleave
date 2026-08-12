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
  const samples = [];

  // Tomamos varias muestras y nos quedamos con las de menor latencia:
  // menos ruido de red ⇒ offset más preciso que un único HEAD request.
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const res = await fetch(window.location.href, {
        method: "HEAD",
        cache: "no-store",
      });
      const serverNow = new Date(res.headers.get("date")).getTime();
      const roundTripMs = performance.now() - start;
      samples.push({ offset: serverNow + roundTripMs / 2 - Date.now(), rtt: roundTripMs });
    } catch {
      // muestra fallida, se ignora
    }
  }

  if (!samples.length) return 0; // seguimos con la hora local como respaldo

  samples.sort((a, b) => a.rtt - b.rtt);
  const best = samples.slice(0, 3);
  return best.reduce((sum, s) => sum + s.offset, 0) / best.length;
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
    // Durante la reproducción solo corrige si el desvío supera 0.3s, para
    // mantener las pantallas bien pegadas sin verse entrecortado.
    if (force || diff > 0.3) {
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

  // Revisa y corrige cada 2 segundos.
  setInterval(correctPosition, 2000);

  // Si la pestaña estuvo oculta/dormida y vuelve, corrige al instante.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) correctPosition(true);
  });
}
