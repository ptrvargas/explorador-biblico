# El Gran Desafío del Explorador Bíblico

**The Great Bible Explorer Challenge — V2.0**

Juego bíblico gratuito ES/EN para actividades de iglesias, jóvenes, adolescentes, niños y familias. Creado por **Ricardo Vargas — @ptrvargas**.

## Funciones
- 100 desafíos por idioma; 2–8 equipos; reloj de 20 segundos.
- Puntuación, tesoros, desempate y recuperación local.
- Bancos personalizados XLSX, exportación y kit para IA.
- PWA instalable y recursos offline después de la primera carga completa.

## Código y publicación
`dist/` contiene el juego. `docs/` es su copia de publicación para GitHub Pages (main, /docs). No requiere servidor ni dependencias de producción externas.

Después de editar `dist/`, ejecutar `python3 scripts/sync-pages.py` y guardar también los cambios de `docs/`.

Pruebas: `node test-v2.cjs`, `node test-audio.cjs`, `node test-storage-pwa.cjs`, `node scripts/check-release.cjs`. La prueba de XLSX requiere JSZip y Python 3.

## Datos locales
Las partidas y los bancos se guardan en cada navegador. Los datos del enlace anterior de ChatGPT Sites no se transfieren automáticamente. Exportar los bancos desde el enlace anterior e importarlos en el nuevo.

## Autoría y licencia
© 2026 Ricardo Vargas — @ptrvargas.

Se permite usar, compartir y modificar gratuitamente, incluso en iglesias, escuelas e instituciones privadas. Se prohíbe vender el juego, cobrar por acceso o distribución y comercializar versiones modificadas sin autorización escrita del autor. Conservar autoría y avisos. Licencia personalizada; no aprobada por la OSI. Ver [LICENSE.md](LICENSE.md) y [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Borrador de revisión
La rama `dev/licencia-pwa-intro` no publica GitHub Pages. La publicación sigue exclusivamente en `main`, carpeta `/docs`. No fusionar ni modificar la configuración de Pages sin autorización expresa.
