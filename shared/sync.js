// Sincroniza un <video> para que TODAS las pantallas que corren
// este script muestren exactamente el mismo frame al mismo tiempo,
// sin necesidad de servidor ni base de datos: se apoyan en la hora
// del sistema (sincronizada por NTP automáticamente al tener internet).

export function initSync(video, t0 = 0) {
  let duration = null;

  function correctPosition(force = false) {
    if (!duration) return;

    const now = Date.now() / 1000; // hora actual en segundos
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

  // Revisa y corrige cada 5 segundos.
  setInterval(correctPosition, 5000);

  // Si la pestaña estuvo oculta/dormida y vuelve, corrige al instante.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) correctPosition(true);
  });
}
