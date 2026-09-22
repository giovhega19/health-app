# FitApp — Móvil (Expo)

App móvil de FitApp: React Native + Expo (managed), TypeScript estricto. Ver `04-arquitectura.md` §2–3 para el stack completo y las capas, y `specs/H0-fundaciones/` para el scaffold inicial (este paquete).

## Requisitos

- Node (ver `.nvmrc` en la raíz del repo).
- pnpm (ver `packageManager` en el `package.json` raíz).

## Scripts

| Script                                   | Qué hace                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm start`                             | Arranca Metro / Expo Dev Tools                                                                                           |
| `pnpm android` / `pnpm ios` / `pnpm web` | Arranca en una plataforma concreta                                                                                       |
| `pnpm lint`                              | ESLint (`eslint-config-expo` + reglas propias, incluida la prohibición de `Date.now()`/`new Date()` directo en `domain`) |
| `pnpm format` / `pnpm format:check`      | Prettier                                                                                                                 |
| `pnpm typecheck`                         | `tsc --noEmit` (TypeScript strict, Art. 8.1)                                                                             |
| `pnpm test`                              | Jest (jest-expo + React Native Testing Library + MSW + fast-check)                                                       |
| `pnpm arch:check`                        | dependency-cruiser: verifica las reglas de capas de `04-arquitectura.md` §3.1 (ver `.dependency-cruiser.js`)             |

## Cobertura de pruebas (Art. 3.2)

Umbral global ≥ 70 %, dominio (`src/shared/domain`) ≥ 90 %. Configurado en `jest.config.js`.

**Excepción temporal (H0):** el script `test` incluye `--passWithNoTests` porque, salvo los value objects fundacionales de `src/shared/domain` (que sí tienen pruebas y cumplen el umbral del 90 %), todavía no existe código de dominio/aplicación real en `src/features/*` (son placeholders de `H0`, ver `specs/H0-fundaciones/plan.md` §7 "Riesgos"). Los overrides de `coverageThreshold` para `src/features/*/domain` y `src/features/*/application` (90 %/80 %) se agregan en `jest.config.js` cuando la primera feature (`Fxx`) tenga código real ahí — un glob de `coverageThreshold` que no matchea ningún archivo hace fallar a Jest igualmente, así que no pueden declararse antes de que exista el código.

**Esta nota y el flag `--passWithNoTests` deben retirarse en H1**, cuando exista la primera funcionalidad con dominio/aplicación reales.

## Estructura

Ver `04-arquitectura.md` §3.2. Resumen:

- `app/` — Expo Router, solo rutas; delegan en `features/<nombre>/presentation`.
- `src/composition/` — composition root (fábricas de adaptadores/casos de uso).
- `src/shared/{domain,infrastructure,ui,i18n}/` — código transversal.
- `src/features/<nombre>/{domain,application,infrastructure,presentation}/` — un módulo por funcionalidad, con `index.ts` como única API pública.
- `e2e/` — flujos Maestro (E2E).
