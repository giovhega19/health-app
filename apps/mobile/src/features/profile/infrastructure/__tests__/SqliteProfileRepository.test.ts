/**
 * `SqliteProfileRepository` (tarea `F01-T09`, integración con SQLite real vía
 * `sql.js`, ver `test/helpers/createTestDb.ts`). CA-01.02.1 (onboarding
 * invitado completo) depende de que el perfil recién creado se pueda leer de
 * vuelta con `findCurrent()`; CA-01.08.1 depende de `clear()`.
 */
import { asId, generateId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { SqliteProfileRepository } from "../SqliteProfileRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

describe("RF-01.03 SqliteProfileRepository", () => {
  it("CA-01.02.1 guarda un perfil y lo recupera con findCurrent()", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteProfileRepository(db, clock);

    const created = UserProfile.create(generateId(clock), aUserProfileProps(), clock.now());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const saveResult = await repository.save(created.value);
    expect(isOk(saveResult)).toBe(true);

    const findResult = await repository.findCurrent();
    expect(isOk(findResult)).toBe(true);
    if (!isOk(findResult)) return;
    expect(findResult.value?.id).toBe(created.value.id);
    expect(findResult.value?.gender).toBe("FEMALE");
    expect(findResult.value?.equipment).toEqual(["NONE"]);
  });

  it("hace upsert por id: guardar el mismo perfil dos veces no duplica filas", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteProfileRepository(db, clock);
    const id = generateId(clock);

    const created = UserProfile.create(id, aUserProfileProps(), clock.now());
    if (!isOk(created)) throw new Error("setup");

    await repository.save(created.value);
    const linked = created.value.withAccountId(asId("00000000-0000-4000-b000-000000000001"));
    await repository.save(linked);

    const findResult = await repository.findCurrent();
    if (!isOk(findResult)) throw new Error("findCurrent failed");
    expect(findResult.value?.accountId).toBe("00000000-0000-4000-b000-000000000001");
  });

  it("findCurrent() devuelve null cuando no hay ningún perfil guardado", async () => {
    const db = await createTestDb();
    const repository = new SqliteProfileRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    const result = await repository.findCurrent();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBeNull();
    }
  });

  it("CA-01.08.1 clear() borra el perfil local", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteProfileRepository(db, clock);
    const created = UserProfile.create(generateId(clock), aUserProfileProps(), clock.now());
    if (!isOk(created)) throw new Error("setup");
    await repository.save(created.value);

    const clearResult = await repository.clear();
    expect(isOk(clearResult)).toBe(true);

    const afterClear = await repository.findCurrent();
    expect(isOk(afterClear) && afterClear.value).toBeNull();
  });
});
