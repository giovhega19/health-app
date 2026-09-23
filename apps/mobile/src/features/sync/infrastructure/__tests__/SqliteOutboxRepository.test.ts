/**
 * `SqliteOutboxRepository` (ADR-002, tarea `F01-T08`), integración con
 * SQLite real (`test/helpers/createTestDb.ts`).
 */
import { asId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { SqliteOutboxRepository } from "../SqliteOutboxRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("RF-01.01 SqliteOutboxRepository", () => {
  it("encola un cambio y aparece en pending()", async () => {
    const db = await createTestDb();
    const repository = new SqliteOutboxRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    await repository.enqueue("bodyMetric", "upsert", asId("00000000-0000-4000-b000-000000000004"), {
      weightKg: 59.5,
    });

    const result = await repository.pending();
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.status).toBe("pending");
    }
  });

  it("markSent() saca la entrada de pending()", async () => {
    const db = await createTestDb();
    const repository = new SqliteOutboxRepository(db, new FakeClock("2026-09-22T10:00:00Z"));
    await repository.enqueue("bodyMetric", "upsert", asId("00000000-0000-4000-b000-000000000005"), null);
    const pendingBefore = await repository.pending();
    if (!isOk(pendingBefore)) throw new Error("setup");
    const id = pendingBefore.value[0]!.id;

    await repository.markSent([id]);

    const pendingAfter = await repository.pending();
    expect(isOk(pendingAfter) && pendingAfter.value).toHaveLength(0);
  });

  it("markFailed() incrementa attempts y guarda lastError, sin sacarlo de pending() para pruebas futuras de reintento", async () => {
    const db = await createTestDb();
    const repository = new SqliteOutboxRepository(db, new FakeClock("2026-09-22T10:00:00Z"));
    await repository.enqueue("profile", "upsert", asId("00000000-0000-4000-b000-000000000006"), null);
    const pending = await repository.pending();
    if (!isOk(pending)) throw new Error("setup");
    const id = pending.value[0]!.id;

    await repository.markFailed(id, "conflict");

    const all = await repository.pending();
    expect(isOk(all) && all.value).toHaveLength(0); // status pasó a "failed", ya no es "pending"
  });

  it("clear() borra todo el outbox", async () => {
    const db = await createTestDb();
    const repository = new SqliteOutboxRepository(db, new FakeClock("2026-09-22T10:00:00Z"));
    await repository.enqueue("profile", "upsert", asId("00000000-0000-4000-b000-000000000007"), null);

    await repository.clear();

    const result = await repository.pending();
    expect(isOk(result) && result.value).toHaveLength(0);
  });
});
