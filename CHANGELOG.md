# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/). Fechas en AAAA-MM-DD.

## [H1] Perfil, onboarding y catálogo — 2026-09-23

### Añadido
- **F01 Perfil y onboarding**: registro/login/refresh rotativo/logout/recuperación de contraseña (Spring Security + JWT + Argon2id), perfil con edad mínima (RN-01) e IMC/TMB (RN-02/RN-03), historial de peso, eliminación de cuenta con purga real de datos de salud, flujo completo de onboarding (11 pantallas: bienvenida → objetivo → nivel → disponibilidad → equipo → datos corporales → PAR-Q → consentimiento → resumen con plan propuesto → cuenta/invitado → notificaciones).
- **F02 Catálogo y propuesta**: `RecommendationEngine` (RN-14) puro con pruebas de propiedades, catálogo de ejercicios/rutinas con filtros, caché de medios offline con política LRU de 300 MB (ADR-008), sincronización incremental del catálogo (`updatedSince`), propuesta de plan semanal ajustable.
- **`features/sync`**: outbox + motor de sincronización push/pull genérico (perfil y peso corporal en H1), con resolución de conflictos last-write-wins por entidad (ADR-007).
- Persistencia real por primera vez: PostgreSQL + Flyway (esquemas `identity`/`profile`/`catalog`) + Testcontainers; SQLite/Drizzle real en el cliente móvil.
- Contrato `openapi.yaml` ampliado con los endpoints de `identity`, `profile`, `sync` y `catalog`.
- ADR-008 (caché de medios LRU) redactado y aceptado; ADR-002, ADR-004 y ADR-007 promovidos de Propuesto a Aceptado tras su primer uso real en producción.
- `specs/F01-perfil-onboarding/{plan.md,tasks.md}` y `specs/F02-catalogo-propuesta/{plan.md,tasks.md}`.

### Corregido (hallazgos de la revisión de seguridad, antes de cerrar el hito)
- **Crítico**: `DELETE /me` no purgaba los datos de salud en `profile_profiles`/`profile_body_metrics`, violando el derecho de supresión (Art. 5.4, RNF-08). Corregido con un evento de dominio `AccountDeleted` (identity → profile, síncrono en la misma transacción) que dispara `PurgeProfileData`.
- **Alto**: condición de carrera en la rotación de refresh tokens permitía eludir la detección de reuso (lectura-luego-escritura sin atomicidad). Corregido con `UPDATE ... WHERE revoked_at IS NULL` atómico.

### Corregido (proceso — encontrado al verificar el CI en un PR real)
- **`.gitignore` excluía silenciosamente ~44 archivos reales del backend.** La regla `out/` (sin anclar, pensada para un directorio de salida de IDE) coincidía también con la convención hexagonal `adapters/out/**` que usa cada módulo del backend. Resultado: toda la capa de persistencia JPA, seguridad (`Argon2PasswordHasherAdapter`, `NimbusTokenIssuer`) y los sync handlers, con sus tests, nunca se commitearon — existían solo en el working tree local (por eso `git status` los mostraba "limpio": los archivos ignorados no aparecen ahí) y el backend "funcionaba" en verificaciones locales repetidas solo porque los archivos ya estaban en disco. Un clon limpio (CI, o cualquier otra persona) obtenía un backend incompleto que fallaba la cobertura de JaCoCo (69% en vez de ~76-87%) sin ningún error de compilación que lo delatara. Corregido anclando la regla a `/out/` (solo la raíz del repo) y commiteando los archivos recuperados. Además se agregaron pruebas MockMvc para los controladores REST (antes al 0% de cobertura), subiendo la cobertura global a 87.3%.
- Verificación local con `./gradlew check` (sin `clean`) puede reportar `UP-TO-DATE` por caché incremental stale y ocultar regresiones reales de cobertura — de aquí en adelante, usar siempre `./gradlew clean check` para cualquier verificación que importe.

### Deuda técnica conocida (no bloqueante)
- Rate limiting de `/auth/*` solo por IP, sin purga de memoria ni límite por cuenta; sin fail-fast si el JWT secret por defecto llega a producción; sin logout desde el móvil; `sync/push` sin límite de tamaño de payload; envío real de email de recuperación fuera de alcance (sin proveedor SMTP); migraciones Drizzle con bootstrap propio en vez del flujo oficial `drizzle-kit`; hash FNV-1a (no SHA-256 truncado) en la caché de medios; pruebas de integración JPA con Testcontainers no ejecutables en Windows con Docker Desktop (incompatibilidad de API conocida, pendiente de confirmar en CI Linux).

### Referencias
- `specs/F01-perfil-onboarding/spec.md` (`CA-01.01.1`–`CA-01.08.1`) y `specs/F02-catalogo-propuesta/spec.md` (`CA-02.01.1`–`CA-02.06.1`) — 16/16 criterios con prueba que los cita.

## [H0] Fundaciones — 2026-09-22

### Añadido
- ADR-001 a ADR-007 en `docs/adr/`, formalizando las decisiones arquitectónicas fundacionales (Expo managed + EAS, offline-first con outbox, monolito modular Spring Modulith, OpenAPI contract-first, motor de temporizador con marcas de tiempo absolutas, Zustand + TanStack Query, sincronización last-write-wins por entidad).
- Monorepo con pnpm workspaces: `apps/mobile` (Expo SDK 57, TypeScript strict, capas domain/application/infrastructure/presentation por feature), `backend` (Spring Boot 3.5.6 + Spring Modulith 1.4.3 sobre Java 21), `packages/api-contract` (OpenAPI 3.1 stub) y `packages/routine-schema` (reservado para F03).
- CI básico en `.github/workflows/ci.yml`: jobs `mobile` (lint, typecheck, test con cobertura, arch:check), `backend` (`./gradlew check`) y `contract` (lint OpenAPI + regeneración de cliente + detección de drift).
- Protección de la rama `main` exigiendo los 3 checks de CI en verde antes de mergear.
- `specs/H0-fundaciones/{spec.md,plan.md,tasks.md}` documentando el hito.

### Corregido
- `ci.yml`: separador `--` duplicado en el paso de cobertura del job `mobile` (`pnpm --filter ... run test -- --coverage`) que hacía que Jest recibiera argumentos inválidos y pasara en verde sin ejecutar ninguna prueba. Corregido a `pnpm --filter @fitapp/mobile test --coverage`.

### Referencias
- PR [#1](https://github.com/giovhega19/health-app/pull/1) (`develop` → `main`), run de CI [35783622594](https://github.com/giovhega19/health-app/actions/runs/35783622594).
- `specs/H0-fundaciones/spec.md` (criterios `CR-H0.1`–`CR-H0.13`).
