/**
 * Prueba unitaria añadida por `dev-mobile-rn` (no de QA) para
 * `HttpCatalogAdapter`: la rama `NETWORK_ERROR` (fallo de red real, p. ej.
 * sin conexión, distinto de una respuesta 5xx del servidor que ya cubre
 * `HttpCatalogAdapter.test.ts` de QA). Requerida para cumplir el umbral de
 * cobertura de infraestructura implícito en el umbral global (Art. 3.2).
 */
import { HttpCatalogAdapter } from "../HttpCatalogAdapter";
import { isOk } from "@/shared/domain/Result";

describe("HttpCatalogAdapter — fallo de red real", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchManifest devuelve NETWORK_ERROR cuando fetch rechaza (sin conexión)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));
    const adapter = new HttpCatalogAdapter("https://api.fitapp.test/api/v1");

    const result = await adapter.fetchManifest();

    expect(isOk(result)).toBe(false);
    if (!isOk(result)) {
      expect(result.error.kind).toBe("NETWORK_ERROR");
    }
  });
});
