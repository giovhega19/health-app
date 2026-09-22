# H0 · Fundaciones

| Campo | Valor |
|---|---|
| Tipo | Infraestructura (no es una funcionalidad de usuario Fxx) |
| Estado | Aprobado — cerrado el 2026-09-22 (PR [#1](https://github.com/giovhega19/health-app/pull/1)) |
| Relacionado | ADR-001 a ADR-007, `04-arquitectura.md` §2, §3, §4, §5 |
| Módulos | Monorepo completo (raíz, `apps/mobile`, `backend`, `packages/*`, CI) |
| Depende de | — (es el primer hito) |

## Objetivo
Dejar listos los **cimientos técnicos** de FitApp —decisiones arquitectónicas fundacionales (ADR), estructura del monorepo y un pipeline de CI básico— antes de implementar cualquier funcionalidad de usuario (Fxx). Ninguna Fxx puede empezar a implementarse sin que H0 esté cerrado, porque F01-F10 dependen de las capas, carpetas y contratos definidos aquí.

A diferencia de una funcionalidad de usuario, H0 no tiene historias de usuario ni criterios de aceptación en Gherkin (no hay una interacción de usuario final que probar): usa criterios verificables `CR-H0.x` en su lugar.

## Alcance

Este documento cubre **dos pasos** dentro del hito H0 más amplio del roadmap. Este `spec.md`, junto con su `plan.md` y `tasks.md`, definen ambos pasos, pero se ejecutan en **rondas separadas**:

### Paso 1 — Documentación fundacional (este paso, ejecutado ahora)
- Los 7 ADR fundacionales (ADR-001 a ADR-007) en `docs/adr/`.
- La definición de la estructura de carpetas del monorepo según `04-arquitectura.md` §3.2 (documentada en `plan.md`, no creada todavía como archivos).
- La definición del CI básico de 3 jobs (`mobile`, `backend`, `contract`), documentada en `plan.md`.
- Esta spec, su plan técnico y su lista de tareas.

### Paso 2 — Scaffold real (ronda posterior, tras aprobación de este paso)
- Creación real de los archivos y carpetas del monorepo (`pnpm-workspace.yaml`, `package.json`, Expo init, proyecto Gradle, `packages/api-contract`, `packages/routine-schema`, `.github/workflows/ci.yml`).
- Ejecutada por `dev-mobile-rn` y `dev-backend-java` siguiendo las tareas `T04` en adelante de `tasks.md`.

## Fuera de alcance (de H0 en general, no solo de este paso)
- **Design system completo** (tokens, componentes base, temas): se especifica y construye en F08 (temas y personalización) y en los planes de cada Fxx que necesite componentes de UI concretos.
- **Backend de identidad real**: en H0 solo se crea el esqueleto vacío del proyecto Spring Boot (`FitAppApplication.java`, paquete `shared` vacío, `application.yml` mínimo sin datasource). La implementación de `identity` (registro, login, refresh) es parte de F01.
- **EAS Build/Submit configurado para publicar**: se configura EAS Build básico como parte del scaffold del Paso 2, pero EAS Submit y el flujo completo de publicación en tiendas se evalúan en H5 (ver `08-publicacion-tiendas.md`).
- **Despliegue a staging**: la infraestructura de despliegue (proveedor de nube, D5) queda diferida a un ADR posterior (ver ADR-003, "Consecuencias").
- **`eas.json` y configuración de perfiles de build**: se crean cuando se aborde el Paso 2 y se confirme la versión del Expo SDK (ver ADR-001).

## Criterios verificables

| ID | Criterio |
|---|---|
| CR-H0.1 | Existen los 7 ADR (`ADR-001.md` a `ADR-007.md`) en `docs/adr/`, cada uno con la estructura de `templates/adr-template.md` (Estado, Fecha, Relacionado, Contexto, Opciones consideradas, Decisión, Consecuencias). |
| CR-H0.2 | La fila de ADR-007 en la tabla de `04-arquitectura.md` §6 dice "por entidad", coincidiendo con RN-18 (`05-modelo-dominio-reglas.md:224`). |
| CR-H0.3 | `pnpm-workspace.yaml` y el `package.json` raíz existen, declaran los workspaces `apps/*` y `packages/*`, y `pnpm install` corre sin error. |
| CR-H0.4 | `apps/mobile` arranca con Expo (`pnpm --filter mobile start` inicia el bundler sin errores) y pasa `pnpm lint` y `pnpm typecheck`. |
| CR-H0.5 | La estructura de carpetas de `apps/mobile/src` coincide con `04-arquitectura.md` §3.2: `composition/`, `shared/{domain,infrastructure,ui,i18n}/`, `features/{profile,catalog,routines,scheduling,workout-session,progress,gamification,settings,mascot,sync,social}/`, cada una con `index.ts` como API pública. |
| CR-H0.6 | `dependency-cruiser` (o `eslint-plugin-boundaries`) está configurado en `apps/mobile` y falla si un módulo de `domain` importa React/Expo o si una feature importa internos de otra. |
| CR-H0.7 | `pnpm test --coverage` corre en `apps/mobile` con `coverageThreshold` configurado según Art. 3.2 (dominio ≥ 90 %, aplicación ≥ 80 %, global ≥ 70 %), aunque el resultado inicial sea trivial por falta de código de dominio. |
| CR-H0.8 | El proyecto `backend/` compila y `./gradlew check` pasa, incluyendo una prueba ArchUnit (`ArchitectureTest`) y una prueba de Spring Modulith (`ApplicationModulesTest`) que, aunque no haya módulos de negocio todavía, verifican la estructura base (`FitAppApplication`, paquete `shared`). |
| CR-H0.9 | `packages/api-contract/openapi.yaml` existe, es válido OpenAPI 3.1.0, declara `/api/v1` como base y el esquema `Problem` de `06-contratos-api.md`, y pasa el linter de OpenAPI configurado. |
| CR-H0.10 | `packages/routine-schema` existe como carpeta reservada con `package.json` y `README.md` (el JSON Schema real se completa en el plan de F03). |
| CR-H0.11 | El workflow `.github/workflows/ci.yml` define exactamente 3 jobs (`mobile`, `backend`, `contract`) y los 3 pasan en verde en un pull request de scaffold. |
| CR-H0.12 | El job `contract` falla si se modifica `openapi.yaml` sin regenerar el cliente TypeScript correspondiente (verificación de drift con `git diff --exit-code`). |
| CR-H0.13 | Ningún archivo de scaffold real (`pnpm-workspace.yaml`, `package.json`, código de Expo, proyecto Gradle, `ci.yml`) se crea durante el Paso 1; solo se crean en el Paso 2, tras la aprobación de `plan.md` y `tasks.md`. |

## Preguntas abiertas
Ninguna al cierre del Paso 1. La versión exacta del Expo SDK (ADR-001) y la herramienta concreta de generación del cliente TypeScript (orval vs. openapi-typescript, ADR-004) se confirman como parte de la ejecución del Paso 2, no bloquean la aprobación de este documento.
