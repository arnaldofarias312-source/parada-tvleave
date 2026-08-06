# Parada TV

> **Nota para IAs de código (ZCode, Antigravity, etc.):** lee esta sección
> completa antes de sugerir o hacer cambios. Contiene contexto de negocio
> que no es obvio solo mirando el código.

## Contexto del proyecto

Este proyecto es para una **parada de autobuses física real**, no una demo.
Va a haber **dos Smart TV instalados en la parada**, cada uno mostrando una
de las dos páginas de este repo, corriendo 24/7 sin supervisión humana
constante (probablemente vía mini PC o Android TV box en modo kiosco).

- `/publicidad` → video en loop a pantalla completa (24/7)
- `/parada` → grid 2x2: un cuadrante muestra el **mismo video** que
  `/publicidad`, los otros 3 dicen **"En proceso"**.

## Reglas importantes para no romper el diseño

1. **Los 3 cuadrantes "En proceso" son intencionales, no un placeholder
   que haya que "completar" con contenido inventado.** El contenido real
   de esos cuadrantes aún no está definido por el dueño del proyecto.
   No generes contenido de ejemplo para ellos (ni clima, ni noticias, ni
   horarios de bus) a menos que se pida explícitamente.
2. **La sincronización del video entre las dos pantallas es el requisito
   más crítico del proyecto.** Debe verse exactamente igual en ambas TV
   al mismo tiempo. El enfoque actual (ver `shared/sync.js`) logra esto
   **sin servidor ni base de datos**, apoyándose en la hora del sistema
   (NTP) y la duración real del video. No reemplaces este enfoque por uno
   con backend/WebSocket a menos que se pida explícitamente — es una
   decisión de arquitectura deliberada, no una limitación a "arreglar".
3. **No hay autenticación ni base de datos en este proyecto.** El único
   servicio externo es Supabase Storage, usado solo para alojar el
   archivo de video. Si el proyecto crece (ej. contenido dinámico en los
   otros cuadrantes), evalúa agregar DB en ese momento, no antes.
4. **Este es un proyecto hermano de BusTrack Realtime** (otro proyecto
   del mismo autor, con su propio Supabase y su propio repo). Son
   independientes — no asumas que comparten backend, tablas, ni deploy.

## 1. Configurar Supabase Storage

1. Crea un proyecto en [supabase.com](https://supabase.com) (puede ser uno nuevo,
   separado del de BusTrack).
2. Storage → **New bucket** → nómbralo `media-parada` → márcalo **Public**.
3. Sube tu video (ej. `ad.mp4`).
4. Click en el archivo → **Copy URL**.
5. Pega esa URL en `shared/config.js`, reemplazando `VIDEO_URL`.

Para cambiar el video en el futuro: sube el nuevo archivo con el
**mismo nombre** al bucket (sobreescribe) y listo — no hay que tocar código
ni redesplegar.

## 2. Subir a GitHub

```bash
cd parada-tv
git init
git add .
git commit -m "Setup inicial parada TV"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/parada-tv.git
git push -u origin main
```

(O usa GitHub Desktop, como ya haces con BusTrack.)

## 3. Deploy en Vercel

1. Vercel → **New Project** → importa el repo `parada-tv`.
2. No hace falta configurar build command ni framework — es HTML/JS estático,
   Vercel lo detecta solo.
3. Deploy. Vas a tener:
   - `https://tu-proyecto.vercel.app/publicidad/`
   - `https://tu-proyecto.vercel.app/parada/`
4. Cada push a `main` redespliega automáticamente.

## 4. Configurar el modo kiosco en cada TV

Depende del dispositivo que conecten al TV:

**Mini PC / Chromebox (recomendado):**
```bash
chrome --kiosk --autoplay-policy=no-user-gesture-required --noerrdialogs --disable-infobars https://tu-proyecto.vercel.app/publicidad/
```

**Android TV box / Fire Stick:**
Instala "Fully Kiosk Browser", configúrala con la URL correspondiente y
activa "Start on boot" + "Autoplay videos".

## Notas sobre la sincronización

`shared/sync.js` calcula cada 5 segundos en qué punto del loop debería
estar el video (basado en la hora actual y la duración real del video) y
corrige si hay más de 0.3s de desvío. Como ambas pantallas hacen el mismo
cálculo con la misma hora, quedan sincronizadas sin comunicarse entre sí.

Si una TV se reinicia a mitad del día, al cargar automáticamente calcula
dónde "debería" estar el video y arranca ahí — no hace falta reiniciar
ambas pantallas a la vez.
