// ⚠️ ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA EMPEZAR

// Pega aquí la URL pública que copiaste de Supabase Storage.
// Storage > tu bucket > tu archivo > "Copy URL"
export const VIDEO_URL =
  "https://yuwbwbfdxlegdocjtkkm.supabase.co/storage/v1/object/public/media-parada/exte.mp4";

// Punto de referencia para el cálculo de sincronización.
// No hace falta tocar esto: es el epoch de Unix (1 enero 1970),
// funciona como "hora cero" común para que ambas pantallas
// calculen la misma posición del video sin hablarse entre sí.
export const T0 = 0;
