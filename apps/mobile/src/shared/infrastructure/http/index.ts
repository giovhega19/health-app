/**
 * Cliente HTTP de la app: `mutator.ts` es el adaptador base (fetch) que usa
 * el cliente TypeScript generado con orval en `generated/` a partir de
 * `packages/api-contract/openapi.yaml` (ver ADR-004, T11). `openapi.yaml`
 * todavía no tiene endpoints (stub de H0), así que `generated/` está casi
 * vacío: el pipeline de generación ya funciona de punta a punta y se
 * llenará endpoint por endpoint a medida que cada Fxx los agregue al
 * contrato.
 */
export {};
