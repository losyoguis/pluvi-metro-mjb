# Guardianes Climáticos MJB – Nivel Pro

## Backend configurado

URL Apps Script:

https://script.google.com/macros/s/AKfycbyJTp9BFuZuOSbIUYlV3r4i54jPYFGRbAkHkTb8UYynhw0S8ZqCBbgUxh0bMtBD4g/exec

## Estructura para GitHub Pages

Suba estos archivos a la raíz del repositorio:

- `index.html`
- `.nojekyll`
- carpeta `assets/`
  - `escudomjb.png`

## Instalación rápida

1. Reemplace el `index.html` actual del repositorio por el que está en `frontend_github_pages/index.html`.
2. Conserve `.nojekyll` en la raíz.
3. Verifique que `assets/escudomjb.png` exista.
4. Espere 1–2 minutos a que GitHub Pages actualice.
5. Abra la web y presione `Cmd + Shift + R`.

## Pruebas del backend

- `https://script.google.com/macros/s/AKfycbyJTp9BFuZuOSbIUYlV3r4i54jPYFGRbAkHkTb8UYynhw0S8ZqCBbgUxh0bMtBD4g/exec?action=ping`
- `https://script.google.com/macros/s/AKfycbyJTp9BFuZuOSbIUYlV3r4i54jPYFGRbAkHkTb8UYynhw0S8ZqCBbgUxh0bMtBD4g/exec?action=bootstrap`
- `https://script.google.com/macros/s/AKfycbyJTp9BFuZuOSbIUYlV3r4i54jPYFGRbAkHkTb8UYynhw0S8ZqCBbgUxh0bMtBD4g/exec?action=bootstrap&callback=test`

## Nota

El dashboard está configurado para consumir datos por JSONP desde GitHub Pages.


## Cambios v2
- Se agregó el bloque superior del proyecto y líder.
- Se eliminó el botón Abrir Google Form.
- Se eliminó el texto instructivo visible sobre subir index.html.


## Cambios v3
- Se corrigió la visualización de la hora cuando Google Sheets la devuelve como fecha base 1899-12-30.
- Se ajustaron los anchos de columnas de la tabla para mejorar lectura en pantalla.


## Cambios v4
- Se agregó el logo `assets/escudomjb.png`.
- Se configuró el favicon con el escudo institucional.
- Se actualizó el texto de botones a “Descargar Excel” y “Descargar PDF”.
- Se agregó una hoja `Informe` en Apps Script con encabezado institucional, proyecto, líder y logo vía URL pública.
- Se añadió `ensurePublicDownloads_()` para permitir que cualquiera con el enlace pueda ver/descargar los informes desde Google Sheets.
- Después de reemplazar `Codigo.gs`, ejecute `setupSistemaPluviometro()` y vuelva a publicar la Web App como nueva versión.


## Cambios v5
- Se corrigió la actualización de tabla y gráficas cuando el backend sí responde.
- Se reemplazó el uso de `.at()` por índices clásicos para máxima compatibilidad.
- Se hizo el renderizado robusto: si una gráfica falla, no bloquea KPIs ni tabla.
- La hora usa `normalizeHour()` para evitar valores tipo 1899.


## Cambios v6 – modo app móvil y descargas públicas
- Se agregó diseño responsive tipo aplicación móvil.
- Se agregó barra inferior móvil con Actualizar, Excel y PDF.
- Se mejoró la visualización en pantallas pequeñas.
- Se agregó la función `habilitarDescargasPublicas()` en Apps Script.
- Para permitir descargas sin correo:
  1. Reemplace `Codigo.gs`.
  2. Ejecute `setupSistemaPluviometro()`.
  3. Ejecute `habilitarDescargasPublicas()`.
  4. Publique una nueva versión de la Web App.
  5. Verifique que el Google Sheets quede compartido como “Cualquier persona con el enlace: lector”.
