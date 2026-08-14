# Instrucciones para desarrollo y mantenimiento

Lee `README.md` primero — tiene el contexto completo del proyecto.

## Resumen rápido
- Proyecto: pantallas web para 2 Smart TV en una parada de autobuses real.
- Sin backend, sin base de datos de datos dinámicos, sin autenticación.
- Único servicio externo: Supabase Storage (solo aloja el video).
- La sincronización entre pantallas es el requisito no-negociable del proyecto.

## Antes de hacer cambios
- Si vas a modificar `shared/sync.js`, confirma con el usuario primero —
  es lógica sensible ya probada y ajustada.
- No agregues dependencias/frameworks (React, Vue, build tools) sin que
  se pida explícitamente. El proyecto es intencionalmente HTML/JS vanilla
  por ser liviano y correr 24/7 en hardware modesto (mini PC / TV box).
- No inventes contenido para los 3 cuadrantes "En proceso" en `/parada`.
- No agregues autenticación, base de datos, ni backend salvo pedido explícito.

## Convenciones del proyecto
- JS en módulos ES nativos (`type="module"`), sin bundler.
- Estilos inline en cada `index.html` (no hay hoja de estilos compartida
  todavía — si se necesita, coordínalo antes de crear una).
- `shared/config.js` es el único archivo pensado para editarse con
  frecuencia (URL del video). Todo lo demás cambia poco.
