# Tareas · H0 Fundaciones

Leyenda:

- `[P]` = paralelizable.
- Estado: ☐ pendiente · ◐ en curso · ☑ hecha.
- Cada tarea debe cumplir la DoD de `07-estrategia-pruebas.md`.

> **Importante:** las tareas `T00`-`T03` corresponden al **Paso 1 (documentación)**, ejecutado en esta ronda. Las tareas `T04`-`T22` corresponden al **Paso 2 (scaffold real)** y se ejecutan en una **ronda POSTERIOR**, únicamente después de que `spec.md`, `plan.md` y `tasks.md` de H0 estén aprobados, conforme a la regla de `CLAUDE.md`: "no escribas código sin `plan.md` y `tasks.md` aprobados para esa funcionalidad". Ningún archivo de scaffold (`pnpm-workspace.yaml`, `package.json`, código de Expo, proyecto Gradle, `ci.yml`) se crea en esta ronda.

| # | Estado | Tarea | Capa | Agente | CR cubiertos | Depende de |
|---|---|---|---|---|---|---|
| T00 | ☑ | Redactar `spec.md` de H0 (objetivo, alcance del paso 1 y 2, criterios `CR-H0.x`) | — | arquitecto | CR-H0.1–CR-H0.13 (definición) | — |
| T01 | ☑ | Redactar ADR-001 a ADR-007 en `docs/adr/` con la plantilla `templates/adr-template.md` | — | arquitecto | CR-H0.1 | T00 |
| T02 | ☑ | Confirmar la resolución de la discrepancia RN-18 vs. `04-arquitectura.md` §6 (last-write-wins por entidad) y corregir la etiqueta en `04-arquitectura.md` | — | arquitecto | CR-H0.2 | T01 (ADR-007) |
| T03 | ☑ | Aprobación del usuario de `spec.md`, `plan.md` y `tasks.md` de H0 (Paso 1) | — | usuario | — | T00, T01, T02, este `plan.md`, este `tasks.md` |
| T04 | ☑ | Config raíz del monorepo: `pnpm-workspace.yaml`, `package.json`, `.npmrc`, `.nvmrc`, `.gitignore`, `.editorconfig` | infra | dev-mobile-rn | CR-H0.3 | T03 |
| T05 | ☑ [P] | Crear estructura de carpetas vacías `apps/`, `packages/`, confirmar `backend/` como carpeta raíz reservada | infra | dev-mobile-rn | CR-H0.3 | T04 |
| T06 | ☑ [P] | Crear `packages/api-contract` con `openapi.yaml` stub (3.1.0, `/api/v1`, esquema `Problem`) y scripts `lint`/`generate`/`validate` | infra | dev-mobile-rn | CR-H0.9 | T05 |
| T07 | ☑ | Ejecutar Expo init en `apps/mobile` (fijar y documentar la versión exacta del SDK, actualizar ADR-001 con la versión elegida), TS strict, ESLint/Prettier | infrastructure | dev-mobile-rn | CR-H0.4 | T05 |
| T08 | ☑ | Crear carpetas de arquitectura móvil: `src/composition`, `src/shared/{domain,infrastructure,ui,i18n}`, `src/features/{profile,catalog,routines,scheduling,workout-session,progress,gamification,settings,mascot,sync,social}` con `index.ts` placeholder en cada una | domain/application/infrastructure/presentation | dev-mobile-rn | CR-H0.5 | T07 |
| T09 | ☑ | Configurar dependency-cruiser / eslint-plugin-boundaries reflejando las capas de `04-arquitectura.md` §3.1 | infra | dev-mobile-rn | CR-H0.6 | T08 |
| T10 | ☑ | Configurar Jest + RNTL + MSW + fast-check con `coverageThreshold` 90/80/70 (Art. 3.2) | infra | dev-mobile-rn | CR-H0.7 | T08 |
| T11 | ☑ [P] | Generar cliente TypeScript desde `openapi.yaml` (orval u openapi-typescript) e integrarlo en `apps/mobile` | infrastructure | dev-mobile-rn | CR-H0.9, CR-H0.12 | T06, T08 |
| T12 | ☑ [P] | Añadir Zustand y TanStack Query como dependencias base de `apps/mobile` (sin stores/queries de negocio todavía) | infrastructure | dev-mobile-rn | — | T08 |
| T13 | ☑ | Inicializar proyecto Gradle Kotlin DSL en `backend/` con plugins Boot/Modulith/ArchUnit/JaCoCo/Spotless | infra | dev-backend-java | CR-H0.8 | T05 |
| T14 | ☑ | Crear `FitAppApplication.java` y paquete `com.fitapp.shared` vacío | domain | dev-backend-java | CR-H0.8 | T13 |
| T15 | ☑ | Escribir `ArchitectureTest` (reglas ArchUnit base) y `ApplicationModulesTest` (`ApplicationModules.verify()`) | domain | dev-backend-java | CR-H0.8 | T14 |
| T16 | ☑ [P] | Crear `application.yml` mínimo sin datasource | infrastructure | dev-backend-java | CR-H0.8 | T14 |
| T17 | ☑ [P] | Crear `packages/routine-schema` con `package.json`/`README.md` (JSON Schema real diferido a F03) | infra | dev-mobile-rn | CR-H0.10 | T05 |
| T18 | ☑ | Crear `.github/workflows/ci.yml` con los 3 jobs (`mobile`, `backend`, `contract`) | infra | dev-backend-java | CR-H0.11 | T09, T10, T11, T15, T16, T17 |
| T19 | ☑ | Abrir PR de scaffold y verificar que los 3 jobs de CI corren y pasan en verde. PR [#1](https://github.com/giovhega19/health-app/pull/1) (`develop`→`main`), run [35783622594](https://github.com/giovhega19/health-app/actions/runs/35783622594): `mobile` ✅ 32s, `backend` ✅ 1m29s, `contract` ✅ 28s. | — | dev-mobile-rn + dev-backend-java | CR-H0.11 | T18 |
| T20 | ☑ | Configurar protección de rama en `main` requiriendo los 3 jobs (vía `gh api`: `required_status_checks` con los 3 contexts, `enforce_admins: true`, sin force-push ni borrado de rama) | — | arquitecto | — | T19 |
| T21 | ☑ | Verificación final de la Definición de Hecho (DoD) de H0 contra todos los `CR-H0.x`. **Hallazgo (corregido):** el paso "Test (with coverage)" del job `mobile` en `ci.yml` tenía un `--` duplicado (bug de `pnpm --filter ... run test -- --coverage` con pnpm 12.5.1) que hacía que Jest recibiera argumentos inválidos y saliera en verde SIN correr ninguna prueba. Corregido a `pnpm --filter @fitapp/mobile test --coverage` (commit `f11af58`) y confirmado tanto local (26/26 tests) como en el PR [#1](https://github.com/giovhega19/health-app/pull/1) (run 35783622594, job `mobile` en verde ejecutando el paso "Test (with coverage)" de verdad). CR-H0.1–CR-H0.13 cumplidos; CR-H0.11 ya verificado en CI real. Pendiente no bloqueante: el commit `61e965b` no sigue Conventional Commits en inglés (Art. 8.3) — decisión del usuario. | — | qa-pruebas | CR-H0.1–CR-H0.13 | T19 |
| T22 | ☑ | Cerrar `spec.md`/`plan.md`/`tasks.md` de H0 (estado Aprobado/hecho) y registrar el hito en `CHANGELOG` | — | arquitecto | — | T20, T21 |
