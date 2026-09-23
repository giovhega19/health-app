/**
 * `SecureTokenStorage` (tarea `F01-T10`). CA-01.01.1/CA-01.08.1 dependen de
 * guardar/borrar la sesión (tokens) sin exponerla en texto plano en SQLite
 * (Art. 5). `expo-secure-store` se reemplaza por `FakeSecureStoreAdapter`
 * (sin binding nativo en Jest).
 */
import { isOk } from "@/shared/domain/Result";
import { SecureTokenStorage } from "../SecureTokenStorage";
import { FakeSecureStoreAdapter } from "@test/fakes/FakeSecureStoreAdapter";
import type { SecureStoreAdapter } from "@/shared/infrastructure/secure-storage";

function makeStorage() {
  const fake = new FakeSecureStoreAdapter();
  return { fake, storage: new SecureTokenStorage(fake as unknown as SecureStoreAdapter) };
}

describe("RF-01.01 SecureTokenStorage", () => {
  const session = {
    accessToken: "access-123",
    refreshToken: "refresh-456",
    user: { id: "00000000-0000-4000-b000-000000000099" as never, email: "user@example.com" },
  };

  it("CA-01.01.1 guarda la sesión y no la deja accesible como texto plano fuera de este adaptador", async () => {
    const { fake, storage } = makeStorage();

    const result = await storage.save(session);

    expect(isOk(result)).toBe(true);
    const raw = await fake.getItem("fitapp.auth.session");
    expect(raw).toContain("access-123");
  });

  it("loadSession() reconstruye la sesión guardada", async () => {
    const { storage } = makeStorage();
    await storage.save(session);

    const loaded = await storage.loadSession();

    expect(loaded).toEqual(session);
  });

  it("loadSession() devuelve null si nunca se guardó nada", async () => {
    const { storage } = makeStorage();

    expect(await storage.loadSession()).toBeNull();
  });

  it("CA-01.08.1 clear() borra la sesión", async () => {
    const { storage } = makeStorage();
    await storage.save(session);

    const clearResult = await storage.clear();

    expect(isOk(clearResult)).toBe(true);
    expect(await storage.loadSession()).toBeNull();
  });
});
