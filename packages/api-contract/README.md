# @fitapp/api-contract

Fuente de verdad del contrato de la API de FitApp (`openapi.yaml`, OpenAPI 3.1.0, contract-first — ver ADR-004 y `06-contratos-api.md`). El backend implementa este contrato y la app móvil consume un cliente TypeScript generado a partir de él. Ningún endpoint se define directamente en el código: primero se agrega aquí.

## Estado en H0

Este paquete arranca como **stub**: `openapi.yaml` no tiene `paths` todavía, solo `info`, `servers` (`/api/v1`) y el esquema común `Problem` (RFC 9457). Los endpoints de cada módulo (`identity`, `profile`, `catalog`, `sync`, ...) se agregan en el plan técnico de la Fxx correspondiente.

## Herramientas elegidas

- **Lint de OpenAPI: [Redocly CLI](https://redocly.com/docs/cli)** (`redocly lint`). Se eligió sobre Spectral por venir integrado en un único CLI (lint + bundle + docs) con una configuración mínima (`redocly.yaml`) y buen soporte de OpenAPI 3.1 desde el primer día.
- **Generación del cliente TypeScript: [orval](https://orval.dev)**. Se eligió sobre `openapi-typescript` porque el stack móvil ya usa **TanStack Query** (`04-arquitectura.md` §2): orval puede generar directamente hooks de TanStack Query (`fetch` client) a partir del contrato, evitando escribir a mano una capa de wrapping sobre tipos planos. La configuración vive en `orval.config.ts` y el cliente generado se escribe dentro de `apps/mobile/src/shared/infrastructure/http/generated/` (ver ese paquete para el `mutator` HTTP real).

Ambas versiones quedan **fijadas (pinned), no en rango**, en `devDependencies` de este `package.json`, para que el job `contract` de CI sea determinista (ver riesgo en `specs/H0-fundaciones/plan.md` §7).

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm --filter @fitapp/api-contract lint` | Corre `redocly lint openapi.yaml` |
| `pnpm --filter @fitapp/api-contract generate` | Regenera el cliente TypeScript en `apps/mobile` a partir de `openapi.yaml` |
| `pnpm --filter @fitapp/api-contract validate` | `lint` + `generate` + `git diff --exit-code` — falla si el cliente generado quedó desactualizado respecto al contrato (detecta drift) |
