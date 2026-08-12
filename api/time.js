// Endpoint de reloj para sincronización: devuelve el tiempo del servidor
// (Vercel) en milisegundos, con precisión de ms (el header HTTP "Date"
// solo tiene precisión de 1 segundo y eso limitaba la sincronización).

module.exports = function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ now: Date.now() });
};