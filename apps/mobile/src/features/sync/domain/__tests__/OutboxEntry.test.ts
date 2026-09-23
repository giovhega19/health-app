/**
 * `OutboxEntry` (ADR-002, tarea `F01-T08`): forma de un cambio local
 * pendiente de enviar. `createOutboxEntry` fija el estado inicial (`pending`,
 * `attempts: 0`, sin error).
 */
import { asId } from "@/shared/domain/Id";
import { createOutboxEntry } from "../OutboxEntry";

describe("sync OutboxEntry", () => {
  it("createOutboxEntry crea una entrada pendiente con attempts=0 y sin error", () => {
    const id = asId("00000000-0000-4000-c000-000000000001");
    const entityId = asId("00000000-0000-4000-c000-000000000002");
    const createdAt = new Date("2026-09-22T10:00:00Z");

    const entry = createOutboxEntry(id, "bodyMetric", "upsert", entityId, { weightKg: 59.5 }, createdAt);

    expect(entry).toEqual({
      id,
      entity: "bodyMetric",
      op: "upsert",
      entityId,
      payload: { weightKg: 59.5 },
      createdAt,
      attempts: 0,
      lastError: null,
      status: "pending",
    });
  });

  it("acepta payload null (p. ej. delete)", () => {
    const entry = createOutboxEntry(
      asId("00000000-0000-4000-c000-000000000003"),
      "profile",
      "delete",
      asId("00000000-0000-4000-c000-000000000004"),
      null,
      new Date("2026-09-22T10:00:00Z"),
    );

    expect(entry.payload).toBeNull();
    expect(entry.op).toBe("delete");
  });
});
