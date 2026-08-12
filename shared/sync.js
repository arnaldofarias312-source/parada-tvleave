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
  // menos ruido de red ⇒ offset más preciso que un único request.
  const clockUrl = new URL("/api/time", window.location.origin);
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const res = await fetch(clockUrl, { cache: "no-store" });
      const data = await res.json();
      const roundTripMs = performance.now() - start;
      samples.push({ offset: data.now + roundTripMs / 2 - Date.now(), rtt: roundTripMs });
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
    const diff = target - video.currentTime; // positivo = atrasado

    // Al cargar (force) o con un desvío grande, salta de golpe a la
    // posición exacta para quedar sincronizado de inmediato.
    if (force || Math.abs(diff) > 0.3) {
      video.currentTime = target;
      video.playbackRate = 1;
      if (video.paused) {
        video.play().catch(() => {
          // Si el navegador bloquea el autoplay, reintenta en el próximo tick.
        });
      }
      return;
    }

    // Corrección fina y continua vía playbackRate (máx ±3%): en vez de
    // saltar, el video se acelera o desacelera imperceptiblemente para
    // converger al reloj sin tirones y mantenerse pegado a él.
    const rate = 1 + diff * 0.5;
    video.playbackRate = Math.max(0.97, Math.min(1.03, rate));

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

  // Revisa y corrige cada segundo para una convergencia suave.
  setInterval(correctPosition, 1000);

  // Si la pestaña estuvo oculta/dormida y vuelve, corrige al instante.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) correctPosition(true);
  });
}
