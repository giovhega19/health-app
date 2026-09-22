# Plan técnico · H0 Fundaciones

> Generado por `arquitecto` a partir de `spec.md` (2026-09-22). No se inicia la implementación sin aprobación.
>
> Este plan cubre **dos pasos**: el Paso 1 (documentación, ADR-001 a ADR-007 y este propio conjunto spec/plan/tasks) se ejecuta ahora. El **Paso 2 (scaffold real)** descrito en detalle en las secciones siguientes se ejecuta en una **ronda posterior**, por los agentes `dev-mobile-rn` y `dev-backend-java`, una vez aprobados `spec.md`, `plan.md` y `tasks.md`.

## 1. Resumen de la solución

Se crea un monorepo con **pnpm workspaces** (sin Turborepo ni Nx) que aloja la app móvil Expo (`apps/mobile`), el backend Spring Boot (`backend/`) y los paquetes compartidos de contrato (`packages/api-contract`, `packages/routine-schema`). Un pipeline de CI de GitHub Actions con 3 jobs (`mobile`, `backend`, `contract`) verifica en cada PR que el código móvil, el backend y el contrato de API estén sanos y sincronizados entre sí, aplicando los gates de cobertura del Art. 3.2 y las reglas de arquitectura del Art. 2.

**Gestor de monorepo — justificación de pnpm workspaces solo (sin Turborepo/Nx):** en H0 el repositorio tiene únicamente dos aplicaciones (`apps/mobile`, `backend`, este último fuera del workspace de Node) y dos paquetes TypeScript compartidos (`packages/api-contract`, `packages/routine-schema`). No hay todavía una necesidad real de caché distribuida de tareas, ejecución selectiva por grafo de dependencias ni pipelines de build complejos entre paquetes: `pnpm --filter` y scripts de orquestación en el `package.json` raíz son suficientes. Introducir Turborepo o Nx en este punto añadiría configuración y una dependencia nueva sin un problema concreto que resuelva, lo cual violaría el principio de simplicidad del propio rol de arquitecto ("no introduzcas librerías sin justificarlas en un ADR"). Si el número de paquetes o el tiempo de CI crecen lo suficiente como para justificarlo, se evaluará en un ADR posterior.

## 2. Impacto por capa

| Capa | Móvil (archivos / elementos nuevos) | Backend |
|---|---|---|
| Domain | `apps/mobile/src/shared/domain/` (placeholders: `Result`, `Entity`, `Id`, `Duration`, `Weight`, puertos `Clock` y `EventBus` — solo tipos/interfaces, sin implementación de negocio en H0) | `backend/src/main/java/com/fitapp/shared/` (paquete vacío, sin clases de dominio de negocio todavía) |
| Application | Ninguno todavío (los casos de uso llegan con cada Fxx) | Ninguno todavía |
| Infrastructure | `apps/mobile/src/shared/infrastructure/` (carpetas reservadas: `db/`, `http/`, `secure-storage/`, `event-bus/`, `system-clock/`, sin implementación real en H0) | `backend/src/main/resources/application.yml` mínimo, sin datasource configurado |
| Presentation / Web | `apps/mobile/app/` (Expo Router con una única ruta placeholder) | `backend/.../FitAppApplication.java` (arranque mínimo, sin controladores de negocio) |

Cada carpeta de `features/*` (`profile`, `catalog`, `routines`, `scheduling`, `workout-session`, `progress`, `gamification`, `settings`, `mascot`, `sync`, `social`) se crea como **placeholder vacío** con su propio `index.ts` (API pública vacía) y las subcarpetas `domain/`, `application/`, `infrastructure/`, `presentation/`, sin lógica de negocio: esa lógica llega con el plan técnico de cada Fxx correspondiente.

## 3. Contratos

- **Cambios en `openapi.yaml`:** se crea el archivo desde cero como stub: `openapi: 3.1.0`, `info` básico de FitApp, `servers` apuntando a `/api/v1`, y el esquema `Problem` (RFC 9457: `type`, `title`, `status`, `detail`, `code`, `errors[]`) descrito en `06-contratos-api.md` §1. **Sin endpoints todavía** — los endpoints de `identity`, `profile`, `catalog`, `sync`, etc. se agregan contract-first en el plan técnico de cada Fxx (ver ADR-004).
- **Puertos (TypeScript):** en H0 solo se declaran las **firmas** de los puertos fundacionales de `shared/domain`, sin adaptadores reales: `Clock.now(): Instant`, `EventBus.publish(event)`/`subscribe(type, handler)`. Los puertos específicos de cada feature (`SessionRepository`, `NotificationPort`, etc.) se definen en el plan técnico de la Fxx correspondiente.
- **Eventos de dominio:** ninguno todavía. La infraestructura del `EventBus` (puerto) se deja lista para que F05 en adelante empiece a publicar/consumir eventos (p. ej. `WorkoutSessionCompleted`).

## 4. Datos

No hay migraciones de datos en H0: ni Drizzle (móvil) ni Flyway (backend) tienen esquemas de negocio que migrar todavía. Se deja preparada la carpeta `apps/mobile/src/shared/infrastructure/db/` para que Drizzle se configure (sin tablas) y el backend arranca con `application.yml` mínimo **sin datasource**, para no forzar una decisión prematura de base de datos de desarrollo antes de que exista un módulo que la necesite. La primera migración real (Flyway) y el primer esquema Drizzle llegan con el plan técnico de F01 (perfil) y F03 (rutinas).

## 5. Estructura del monorepo (Paso 2)

Raíz del repositorio:
- `pnpm-workspace.yaml` → declara `apps/*` y `packages/*`.
- `package.json` raíz → scripts de orquestación (`lint`, `typecheck`, `test`, `arch:check` delegados vía `pnpm -r`).
- `.npmrc` → configuración de pnpm (p. ej. `strict-peer-dependencies`).
- `.nvmrc` → versión de Node compatible con el Expo SDK elegido en ADR-001 (se fija al ejecutar el scaffold).
- `.gitignore`, `.editorconfig`.

`packages/api-contract/`:
- `openapi.yaml` (stub descrito en la sección 3).
- Scripts: `lint` (validador de OpenAPI, p. ej. Spectral o Redocly), `generate` (genera el cliente TS para móvil y las interfaces para el backend), `validate` (lint + generate + verificación de que no hay drift).

`apps/mobile/`:
- Expo init con el SDK confirmado en el momento del scaffold (ADR-001), TypeScript `strict`, ESLint + Prettier.
- Expo Router con una ruta placeholder (`app/index.tsx`) que solo confirma que la app arranca.
- `src/composition/` (composition root, vacío salvo un contenedor mínimo).
- `src/shared/{domain,infrastructure,ui,i18n}/` según `04-arquitectura.md` §3.2.
- `src/features/{profile,catalog,routines,scheduling,workout-session,progress,gamification,settings,mascot,sync,social}/` — placeholders sin lógica de dominio, cada uno con `index.ts`.
- `assets/` (vacío, listo para medios).
- `e2e/` (Maestro, sin flujos todavía).
- `dependency-cruiser.config.js` o configuración de `eslint-plugin-boundaries` reflejando las capas de §3.1 (domain no importa React/Expo/fetch/SQLite/`Date.now()`; application no importa UI; infrastructure no importa presentation; ninguna feature importa internos de otra).
- Jest + React Native Testing Library + MSW + fast-check configurados, con `coverageThreshold` en `jest.config` según Art. 3.2: dominio ≥ 90 %, aplicación ≥ 80 %, global ≥ 70 %.

`backend/`:
- Proyecto **Gradle único** con **Kotlin DSL** (`build.gradle.kts`), **sin** módulos Gradle separados: la modularidad se logra vía Spring Modulith por paquete (`com.fitapp.<modulo>`), no por subproyectos Gradle (ver ADR-003).
- Plugins: Spring Boot, Spring Modulith, ArchUnit (como dependencia de test), JaCoCo, Spotless.
- `FitAppApplication.java` (arranque mínimo).
- Paquete `com.fitapp.shared` vacío (kernel compartido reservado).
- Pruebas: `ArchitectureTest` (reglas ArchUnit base: dominio no importa `org.springframework..`/`jakarta.persistence..`/`adapters..`) y `ApplicationModulesTest` (`ApplicationModules.verify()` de Spring Modulith).
- `application.yml` mínimo, sin datasource configurado.

`packages/routine-schema/`:
- Carpeta reservada con `package.json` y `README.md` explicando que el JSON Schema real de `06-contratos-api.md` §4 se completa en el plan técnico de F03.

`.github/workflows/ci.yml`:
- Job `mobile`: `pnpm lint && pnpm typecheck && pnpm test --coverage && pnpm arch:check` (dependency-cruiser/boundaries).
- Job `backend`: `./gradlew check` (JUnit + ArchUnit + Spring Modulith + JaCoCo).
- Job `contract`: lint de `openapi.yaml`, regeneración del cliente/interfaces, `git diff --exit-code` para detectar drift.
- Gates de cobertura del Art. 3.2 aplicados en `mobile` (JaCoCo aplica los mismos umbrales en `backend`).
- **Sin** jobs de EAS ni de despliegue a staging en H0.

## 6. Estrategia de pruebas

| CR | Nivel | Verificación prevista |
|---|---|---|
| CR-H0.1, CR-H0.2 | Documental | Revisión manual del arquitecto contra `templates/adr-template.md` y RN-18 |
| CR-H0.3 | Infraestructura | `pnpm install` en CI (job `mobile` y `contract`) |
| CR-H0.4, CR-H0.5, CR-H0.6, CR-H0.7 | Móvil | Job `mobile` de `ci.yml`: lint, typecheck, test --coverage, arch:check |
| CR-H0.8 | Backend | Job `backend` de `ci.yml`: `./gradlew check` (incluye `ArchitectureTest`, `ApplicationModulesTest`) |
| CR-H0.9, CR-H0.12 | Contrato | Job `contract` de `ci.yml`: lint OpenAPI + regeneración + `git diff --exit-code` |
| CR-H0.10 | Documental | Revisión manual de `packages/routine-schema/README.md` |
| CR-H0.11 | CI | Verificación manual de que los 3 jobs corren y pasan en un PR real de scaffold (tarea T19) |
| CR-H0.13 | Proceso | Revisión del arquitecto: ningún archivo de scaffold aparece en el PR del Paso 1 |

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Los gates de cobertura (Art. 3.2) son triviales o vacíos porque todavía no existe código de dominio real | Configurar `--passWithNoTests` de forma temporal en el job `mobile` durante H0; revisar y retirar esta excepción explícitamente al cerrar H1 (primera Fxx con código de dominio real) |
| La versión exacta del Expo SDK no se conoce hasta el momento del scaffold | ADR-001 documenta esto explícitamente como acción pendiente; se fija y registra en `T07` |
| La decisión de proveedor de hosting (D5) sigue diferida | El scaffold del backend (`T13`-`T16`) no debe asumir ningún proveedor de nube concreto: solo Docker local/Compose para desarrollo, sin credenciales ni configuración específica de un proveedor |
| Introducir dependency-cruiser/boundaries mal configurado podría dar falsos negativos (no detectar violaciones de capas) | Se agrega una prueba de humo que fuerza una violación deliberada en una rama de prueba local antes de fusionar la configuración (no forma parte del PR final) |
| El job `contract` podría no detectar drift si el script de generación no es determinista | Fijar versión exacta de la herramienta de generación (orval/openapi-typescript, openapi-generator) en `package.json`/`build.gradle.kts` con versión bloqueada, no rango |

## 8. ADR requeridos

Todos ya redactados como parte de este mismo paso: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007 (`docs/adr/`). No se identifican ADR adicionales necesarios para H0. La decisión de proveedor de hosting (D5) requerirá un ADR propio cuando se aborde, fuera del alcance de H0.

## 9. Feature flags

Ninguno en H0. El mecanismo de feature flags (remote config + valores por defecto locales, mencionado en `04-arquitectura.md` §3.4) se implementa como parte del plan técnico de F10 (amigos y retos, v2) y se usa desde entonces para cualquier funcionalidad marcada como v2.
