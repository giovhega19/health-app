/**
 * RF-02.06 `HttpCatalogAdapter` (`features/catalog/infrastructure/HttpCatalogAdapter.ts`,
 * relacionada con la tarea `F02-T14`, todavía no implementada: esta prueba
 * falla ahora mismo con "Cannot find module '../HttpCatalogAdapter'", el
 * estado rojo esperado).
 *
 * Implementa `CatalogManifestPort` contra `GET /catalog/manifest`,
 * `GET /catalog/exercises?updatedSince=`, `GET /catalog/routines?updatedSince=`
 * (`packages/api-contract/openapi.yaml`, CA-02.06.1). Se prueba con MSW
 * (sin red real, 07-estrategia-pruebas.md §2.3): esta es la primera prueba
 * de infraestructura de F02 que usa MSW en `apps/mobile`; si el entorno de
 * Jest necesita ajustes adicionales (p. ej. un `setupFilesAfterEach` global
 * para `server.listen()`), se resuelven junto con la implementación real
 * (`F02-T14`), no en esta fase roja.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpCatalogAdapter } from "../HttpCatalogAdapter";
import { isOk } from "@/shared/domain/Result";

const BASE_URL = "https://api.fitapp.test/api/v1";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("RF-02.06 HttpCatalogAdapter", () => {
  it("CA-02.06.1 fetchManifest hace GET /catalog/manifest y devuelve el manifiesto parseado", async () => {
    server.use(
      http.get(`${BASE_URL}/catalog/manifest`, () =>
        HttpResponse.json({
          version: 3,
          exercisesEtag: "etag-exercises-v3",
          routinesEtag: "etag-routines-v3",
          mediaBaseUrl: "https://cdn.fitapp.test/",
          updatedAt: "2026-02-01T00:00:00Z",
        }),
      ),
    );
    const adapter = new HttpCatalogAdapter(BASE_URL);

    const result = await adapter.fetchManifest();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.version).toBe(3);
    expect(result.value.mediaBaseUrl).toBe("https://cdn.fitapp.test/");
  });

  it("CA-02.06.1 fetchUpdatedSince('exercises', since) hace GET /catalog/exercises?updatedSince=<ISO> (sincronización incremental)", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE_URL}/catalog/exercises`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ items: [] });
      }),
    );
    const adapter = new HttpCatalogAdapter(BASE_URL);
    const since = new Date("2026-01-15T00:00:00.000Z");

    const result = await adapter.fetchUpdatedSince("exercises", since);

    expect(isOk(result)).toBe(true);
    expect(capturedUrl?.searchParams.get("updatedSince")).toBe(since.toISOString());
  });

  it("CA-02.06.1 fetchUpdatedSince sin `since` (primera sincronización) no envía updatedSince: descarga el catálogo completo", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE_URL}/catalog/routines`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ items: [] });
      }),
    );
    const adapter = new HttpCatalogAdapter(BASE_URL);

    await adapter.fetchUpdatedSince("routines", null);

    expect(capturedUrl?.searchParams.has("updatedSince")).toBe(false);
  });

  it("con una respuesta 5xx del servidor, devuelve un HttpError en vez de lanzar", async () => {
    server.use(
      http.get(`${BASE_URL}/catalog/manifest`, () => HttpResponse.json({}, { status: 503 })),
    );
    const adapter = new HttpCatalogAdapter(BASE_URL);

    const result = await adapter.fetchManifest();

    expect(isOk(result)).toBe(false);
  });
});
