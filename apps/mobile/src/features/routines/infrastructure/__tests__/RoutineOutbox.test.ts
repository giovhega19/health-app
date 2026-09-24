/**
 * Sync: `Routine`/`CustomExercise` se pueden encolar en el `outbox` con el
 * mismo `EnqueueChange` genérico que ya usan `profile`/`bodyMetric` (F01,
 * ADR-002) — sin tocar `features/sync` (Art. 9.1/9.2): `entity` es un
 * `string` sin restricción de enum en el puerto, así que "routine"/
 * "customExercise" ya son valores válidos hoy. Referencia:
 * `packages/api-contract/openapi.yaml` `SyncEntity` ampliado con `routine`/
 * `customExercise` (`F03-T03`).
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { createSyncContainer } from "@/features/sync";
import { FakeOutboxRepository } from "@test/fakes/FakeOutboxRepository";
import { FakeSyncTransportPort } from "@test/fakes/FakeSyncTransportPort";
import { FakeCursorStore } from "@test/fakes/FakeCursorStore";

function buildEnqueueChange(outbox: FakeOutboxRepository) {
  return createSyncContainer({
    outboxRepository: outbox,
    transport: new FakeSyncTransportPort(),
    cursorStore: new FakeCursorStore(),
    deviceId: "test-device",
    entityAppliers: [],
  }).enqueueChange;
}

describe("Sync — encolar cambios de routine/customExercise en el outbox", () => {
  it('encola un upsert de entity="routine"', async () => {
    const outbox = new FakeOutboxRepository();
    const enqueueChange = buildEnqueueChange(outbox);
    const routineId = asId("00000000-0000-4000-b200-000000000001");

    const result = await enqueueChange.execute("routine", "upsert", routineId, { name: "Pierna casa" });

    expect(isOk(result)).toBe(true);
    const pending = await outbox.pending();
    expect(isOk(pending)).toBe(true);
    if (isOk(pending)) {
      expect(pending.value).toHaveLength(1);
      expect(pending.value[0]!.entity).toBe("routine");
      expect(pending.value[0]!.entityId).toBe(routineId);
    }
  });

  it('encola un upsert de entity="customExercise"', async () => {
    const outbox = new FakeOutboxRepository();
    const enqueueChange = buildEnqueueChange(outbox);
    const exerciseId = asId("00000000-0000-4000-b200-000000000002");

    const result = await enqueueChange.execute("customExercise", "upsert", exerciseId, { name: "Fondos en silla" });

    expect(isOk(result)).toBe(true);
    const pending = await outbox.pending();
    expect(isOk(pending)).toBe(true);
    if (isOk(pending)) {
      expect(pending.value[0]!.entity).toBe("customExercise");
    }
  });
});
