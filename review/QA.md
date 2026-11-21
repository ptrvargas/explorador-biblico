# Informe de revisión — V2.0 licencia, instalación e intro

## Aislamiento
- Repositorio: ptrvargas/explorador-biblico.
- Base pública: main @ 1716e0ad06cb18ff3d9cc95806083bae270251a9.
- GitHub Pages comprobado en ajustes: Deploy from a branch, main, /docs.
- Rama de trabajo: dev/licencia-pwa-intro. Sin integración a main ni cambios de Pages.
- ChatGPT Sites no se ha modificado.

## Cambios
- LICENSE.md bilingüe y avisos de terceros, con el mismo contenido visible en Acerca de.
- Uso gratuito incluso en instituciones privadas, atribución obligatoria, sin venta/cobro de acceso o distribución ni comercialización de modificaciones sin permiso escrito. Licencia personalizada, no OSI.
- Botón de instalación en Inicio y Ajustes. Android/desktop usan beforeinstallprompt si existe; en caso contrario muestran pasos. iOS/iPadOS ofrecen instrucciones según Safari u otro navegador.
- userChoice aceptado no se presenta como instalación completada: solo appinstalled o ejecución standalone cambian el estado.
- Intro de 2 segundos por carga, icono EB existente reutilizado, ES/EN, créditos, botón para omitir/Escape y foco controlado. Con movimiento reducido se omite.
- Service worker incluye los avisos y el nuevo script; nuevo identificador de caché. No se fuerza skipWaiting durante una partida.

## Pruebas automatizadas aprobadas
- test-pwa-intro.cjs: Android nativo/alternativo; iOS Safari y Chrome; iPadOS con UA de Mac; desktop; standalone; aceptación, cancelación y error; confirmación del navegador; intro ES/EN, duración, omisión, Escape, idioma, una vez por carga, movimiento reducido y liberación de foco; créditos/licencia; señal de caché de la versión correcta; eventos de instalación sin reiniciar el render del juego.
- test-v2.cjs: 2/4/8 equipos, turnos, puntuación, 20 segundos, clics tardíos, reciclaje, bonus, empate y rondas completas, persistencia e importación validada.
- test-audio.cjs: sonidos y silencio inmediato.
- test-storage-pwa.cjs: IndexedDB, restauración, idiomas independientes, navegación offline simulada y todos los recursos de caché presentes.
- test-workbook.cjs: XLSX reales ES/EN, ida y vuelta de 1.000 tarjetas, categorías vacías y rechazos seguros.
- scripts/check-release.cjs: 200 tarjetas idénticas a fuentes aprobadas, distribución/IDs/respuestas y prompt universal intacto.
- Comprobaciones adicionales: sintaxis JS, rutas relativas, manifest e iconos, paridad dist/docs y archivos de motor/bancos sin cambios.

## Límites y pendientes
- No se ha comprobado físicamente instalación/icono/apertura standalone/offline en Android, iPhone o iPad, ni instalación nativa desktop.
- La prueba de navegador de este borrador no pudo abrir el servidor local (conexión rechazada); revisión visual pendiente de ES/EN, intro, créditos y botón en tamaños móvil/tablet/proyector.
- Las pruebas de eventos PWA son simuladas; no prueban la elegibilidad que decide cada navegador.
- No hay enlace jugable independiente: Pages de este repositorio tiene una sola fuente pública, main /docs. No se cambió ni se creó otro repositorio o alojamiento. La rama y la solicitud de revisión permiten examinar el código, no ejecutarlo como web.
- Los avisos de RVR1960, NKJV, JSZip y recursos gráficos no conceden derechos de terceros. No se afirma permiso especial del editor. El alcance de citas y la procedencia de recursos deben comprobarse antes de autorizar redistribuciones separadas; bancos conservados sin cambios.

## Cómo revisar localmente sin publicar
Descargar ZIP de la rama de desarrollo desde GitHub (Code → Download ZIP), extraer, abrir una terminal en la carpeta y ejecutar:

```sh
python3 -m http.server 8080 --directory docs
```

Abrir http://localhost:8080 en el mismo computador. Probar intro ES/EN (cambiar idioma y recargar), omitir, créditos y botón de instalación. Para PWA, usar localhost o HTTPS; abrir un HTML desde Archivos o una IP LAN por HTTP no constituye una prueba válida de instalación.

No fusionar ni publicar hasta recibir autorización explícita de Ricardo Vargas.
