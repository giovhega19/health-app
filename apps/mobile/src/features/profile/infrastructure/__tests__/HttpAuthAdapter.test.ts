/**
 * `HttpAuthAdapter` (RF-01.01, tarea `F01-T10`): implementa `AuthPort` contra
 * `POST /auth/register`, `/auth/login`, `/auth/guest/upgrade`, `DELETE /me`.
 * Se prueba con MSW (sin red real), igual que `HttpCatalogAdapter.test.ts`.
 * CA-01.01.1 (invitado -> cuenta), CA-01.08.1 (eliminar cuenta).
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpAuthAdapter } from "../HttpAuthAdapter";
import { isErr, isOk } from "@/shared/domain/Result";

const BASE_URL = "https://api.fitapp.test/api/v1";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const AUTH_TOKENS = {
  accessToken: "access-token-123",
  refreshToken: "refresh-token-456",
  user: { id: "00000000-0000-4000-b000-000000000010", email: "user@example.com" },
};

describe("RF-01.01 HttpAuthAdapter", () => {
  it("register hace POST /auth/register y devuelve la sesión", async () => {
    server.use(
      http.post(`${BASE_URL}/auth/register`, () => HttpResponse.json(AUTH_TOKENS, { status: 201 })),
    );
    const adapter = new HttpAuthAdapter(BASE_URL);

    const result = await adapter.register({
      email: "user@example.com",
      password: "password123",
      acceptedTermsVersion: "v1",
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.accessToken).toBe("access-token-123");
    expect(result.value.user.email).toBe("user@example.com");
  });

  it("login hace POST /auth/login", async () => {
    server.use(http.post(`${BASE_URL}/auth/login`, () => HttpResponse.json(AUTH_TOKENS)));
    const adapter = new HttpAuthAdapter(BASE_URL);

    const result = await adapter.login({ email: "user@example.com", password: "password123" });

    expect(isOk(result)).toBe(true);
  });

  it("con credenciales inválidas (401), devuelve un AuthError en vez de lanzar", async () => {
    server.use(
      http.post(`${BASE_URL}/auth/login`, () =>
        HttpResponse.json({ title: "Unauthorized" }, { status: 401 }),
      ),
    );
    const adapter = new HttpAuthAdapter(BASE_URL);

    const result = await adapter.login({ email: "user@example.com", password: "wrong" });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("HTTP_401");
    }
  });

  it("CA-01.01.1 guestUpgrade hace POST /auth/guest/upgrade con el mismo cuerpo que register", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${BASE_URL}/auth/guest/upgrade`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(AUTH_TOKENS, { status: 201 });
      }),
    );
    const adapter = new HttpAuthAdapter(BASE_URL);

    const result = await adapter.guestUpgrade({
      email: "guest@example.com",
      password: "password123",
      acceptedTermsVersion: "v1",
    });

    expect(isOk(result)).toBe(true);
    expect(capturedBody).toMatchObject({ email: "guest@example.com", healthDataConsent: true });
  });

  it("CA-01.08.1 deleteAccount hace DELETE /me con el header Authorization", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.delete(`${BASE_URL}/me`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return new HttpResponse(null, { status: 202 });
      }),
    );
    const adapter = new HttpAuthAdapter(BASE_URL, async () => "the-access-token");

    const result = await adapter.deleteAccount();

    expect(isOk(result)).toBe(true);
    expect(capturedAuth).toBe("Bearer the-access-token");
  });

  it("deleteAccount sin token disponible, no agrega el header Authorization", async () => {
    let sawAuthHeader = true;
    server.use(
      http.delete(`${BASE_URL}/me`, ({ request }) => {
        sawAuthHeader = request.headers.has("authorization");
        return new HttpResponse(null, { status: 202 });
      }),
    );
    const adapter = new HttpAuthAdapter(BASE_URL);

    await adapter.deleteAccount();

    expect(sawAuthHeader).toBe(false);
  });

  it("con un error de red (5xx), deleteAccount devuelve un AuthError", async () => {
    server.use(http.delete(`${BASE_URL}/me`, () => HttpResponse.json({}, { status: 500 })));
    const adapter = new HttpAuthAdapter(BASE_URL);

    const result = await adapter.deleteAccount();

    expect(isErr(result)).toBe(true);
  });
});
