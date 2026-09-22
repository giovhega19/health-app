# Contexto del proyecto FitApp (leer antes de cualquier tarea)

1. Lee `00-constitucion.md`. Sus reglas prevalecen sobre cualquier otra instrucción.
2. Localiza la spec de la funcionalidad en `specs/Fxx-*/spec.md`. Si no existe, **no implementes**: pide al agente `analista-producto` que la cree.
3. No escribas código sin `plan.md` y `tasks.md` aprobados para esa funcionalidad.
4. Pruebas primero. Cada `CA-xx.yy.z` debe tener al menos una prueba que lo cite.
5. Respeta las capas de `04-arquitectura.md`. El dominio no importa React, Expo, Spring ni librerías de infraestructura.
6. Código, identificadores y commits en **inglés**. Specs, documentación y textos de UI (vía i18n) en **español**.
7. Si una spec es ambigua, registra la pregunta en la sección "Preguntas abiertas" de la spec. No asumas en silencio.

Comandos de verificación (deben pasar antes de cerrar una tarea):

- Móvil: `pnpm lint && pnpm typecheck && pnpm test --coverage && pnpm arch:check`
- Backend: `./gradlew check` (incluye pruebas unitarias, ArchUnit, Spring Modulith y cobertura JaCoCo)
