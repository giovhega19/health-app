import { defineConfig } from "orval";

/**
 * Genera el cliente TypeScript de `apps/mobile` a partir de `openapi.yaml`
 * (ver ADR-004, README.md de este paquete). Se usa el cliente `react-query`
 * (hooks de TanStack Query) porque el stack móvil ya usa TanStack Query
 * para el estado del servidor (04-arquitectura.md §2).
 *
 * `openapi.yaml` es un stub sin `paths` en H0, así que el resultado es
 * mínimo (solo el esquema `Problem`); el pipeline de generación queda
 * probado de punta a punta para cuando cada Fxx agregue sus endpoints.
 */
export default defineConfig({
  fitapp: {
    input: {
      target: "./openapi.yaml",
    },
    output: {
      mode: "tags-split",
      target: "../../apps/mobile/src/shared/infrastructure/http/generated/client.ts",
      schemas: "../../apps/mobile/src/shared/infrastructure/http/generated/models",
      client: "react-query",
      httpClient: "fetch",
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: "../../apps/mobile/src/shared/infrastructure/http/mutator.ts",
          name: "apiClient",
        },
      },
    },
  },
});
