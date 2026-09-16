// ⚠️ ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA EMPEZAR

// Video para pantalla de publicidad (alta definición)
export const VIDEO_URL_PUBLICIDAD =
  "https://sfwlrpwamioiazmqfpmp.supabase.co/storage/v1/object/public/media-parada/exte.mp4";

// Video para el panel de la parada (optimizado, liviano y fluido para el Smart TV)
export const VIDEO_URL_PANEL =
  "https://sfwlrpwamioiazmqfpmp.supabase.co/storage/v1/object/public/media-parada/exte_panel.mp4";

// Compatibilidad general
export const VIDEO_URL = VIDEO_URL_PUBLICIDAD;

// Punto de referencia para el cálculo de sincronización.
// No hace falta tocar esto: es el epoch de Unix (1 enero 1970),
// funciona como "hora cero" común para que ambas pantallas
// calculen la misma posición del video sin hablarse entre sí.
export const T0 = 0;
