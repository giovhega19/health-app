/**
 * `HttpProfileAdapter` (RF-01.03/RF-01.06, tarea `F01-T12`/`F01-T16`):
 * implementa `RemoteProfilePort` contra `PUT /me/profile`. Se prueba con MSW
 * (sin red real), igual que `HttpAuthAdapter.test.ts`.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpProfileAdapter } from "../HttpProfileAdapter";
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

const BASE_URL = "https://api.fitapp.test/api/v1";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function aProfile(): UserProfile {
  const created = UserProfile.create(
    asId("00000000-0000-4000-b000-000000000007"),
    aUserProfileProps(),
    new Date("2026-09-23T00:00:00Z"),
  );
  if (!isOk(created)) {
    throw new Error("fixture inválida: UserProfile.create debería aceptar un perfil válido");
  }
  return created.value;
}

describe("RF-01.03/RF-01.06 HttpProfileAdapter", () => {
  it("update hace PUT /me/profile con el header Authorization y el cuerpo UserProfileDto", async () => {
    let capturedAuth: string | null = null;
    let capturedBody: unknown;
    server.use(
      http.put(`${BASE_URL}/me/profile`, async ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        capturedBody = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const adapter = new HttpProfileAdapter(BASE_URL, async () => "the-access-token");

    const result = await adapter.update(aProfile());

    expect(isOk(result)).toBe(true);
    expect(capturedAuth).toBe("Bearer the-access-token");
    expect(capturedBody).toMatchObject({
      heightCm: 165,
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      daysPerWeek: 3,
      minutesPerSession: 30,
      unitSystem: "METRIC",
    });
  });

  it("sin token disponible, no agrega el header Authorization", async () => {
    let sawAuthHeader = true;
    server.use(
      http.put(`${BASE_URL}/me/profile`, ({ request }) => {
        sawAuthHeader = request.headers.has("authorization");
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const adapter = new HttpProfileAdapter(BASE_URL);

    await adapter.update(aProfile());

    expect(sawAuthHeader).toBe(false);
  });

  it("con un error del servidor (422 por datos inválidos), devuelve un AuthError en vez de lanzar", async () => {
    server.use(http.put(`${BASE_URL}/me/profile`, () => HttpResponse.json({}, { status: 422 })));
    const adapter = new HttpProfileAdapter(BASE_URL);

    const result = await adapter.update(aProfile());

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("HTTP_422");
    }
  });
});
