# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/). Fechas en AAAA-MM-DD.

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
