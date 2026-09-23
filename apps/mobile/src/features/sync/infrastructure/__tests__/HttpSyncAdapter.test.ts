/**
 * `HttpSyncAdapter` (ADR-002, tarea `F01-T08`). CA-01.01.1: `push`/`pull`
 * contra `POST /sync/push`/`GET /sync/pull`. Probado con MSW.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpSyncAdapter } from "../HttpSyncAdapter";
import { isOk } from "@/shared/domain/Result";

const BASE_URL = "https://api.fitapp.test/api/v1";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("RF-01.01 HttpSyncAdapter", () => {
  it("push hace POST /sync/push con deviceId y changes", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE_URL}/sync/push`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ accepted: ["c1"], rejected: [], serverTime: "2026-09-22T10:00:00Z" });
      }),
    );
    const adapter = new HttpSyncAdapter(BASE_URL);

    const result = await adapter.push("device-1", [
      { entity: "bodyMetric", op: "upsert", id: "c1", updatedAt: "2026-09-22T10:00:00Z", data: {} },
    ]);

    expect(isOk(result)).toBe(true);
    expect(capturedBody).toMatchObject({ deviceId: "device-1" });
  });

  it("pull hace GET /sync/pull?cursor= cuando hay cursor guardado", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE_URL}/sync/pull`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ changes: [], hasMore: false });
      }),
    );
    const adapter = new HttpSyncAdapter(BASE_URL);

    await adapter.pull("cursor-abc");

    expect(capturedUrl?.searchParams.get("cursor")).toBe("cursor-abc");
  });

  it("pull sin cursor (primera sincronización) no envía el parámetro cursor", async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${BASE_URL}/sync/pull`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ changes: [], hasMore: false });
      }),
    );
    const adapter = new HttpSyncAdapter(BASE_URL);

    await adapter.pull(null);

    expect(capturedUrl?.searchParams.has("cursor")).toBe(false);
  });

  it("con un error de red, devuelve un SyncHttpError en vez de lanzar", async () => {
    server.use(http.post(`${BASE_URL}/sync/push`, () => HttpResponse.json({}, { status: 503 })));
    const adapter = new HttpSyncAdapter(BASE_URL);

    const result = await adapter.push("device-1", []);

    expect(isOk(result)).toBe(false);
  });
});
