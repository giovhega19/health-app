/**
 * `PullRemoteChanges` (ADR-002, tarea `F01-T08`). CA-01.01.1: los cambios
 * remotos se aplican localmente vía el `SyncEntityApplier` registrado para
 * cada `entity`, y el cursor avanza tras aplicarlos.
 */
import { err, isOk, ok } from "@/shared/domain/Result";
import { PullRemoteChanges } from "../PullRemoteChanges";
import { FakeSyncTransportPort } from "@test/fakes/FakeSyncTransportPort";
import { FakeCursorStore } from "@test/fakes/FakeCursorStore";
import type { RemoteChange, SyncEntityApplier } from "../ports";

class RecordingApplier implements SyncEntityApplier {
  applied: RemoteChange[] = [];

  supports(entity: string): boolean {
    return entity === "profile";
  }

  async apply(change: RemoteChange) {
    this.applied.push(change);
    return ok(undefined);
  }
}

describe("RF-01.01 PullRemoteChanges", () => {
  it("aplica los cambios remotos con el applier que soporta su entity y avanza el cursor", async () => {
    const transport = new FakeSyncTransportPort();
    transport.nextPullResult = ok({
      changes: [{ entity: "profile", op: "upsert", id: "p1", updatedAt: "2026-09-22T10:00:00Z", data: {} }],
      nextCursor: "cursor-2",
      hasMore: false,
    });
    const cursorStore = new FakeCursorStore();
    const applier = new RecordingApplier();
    const useCase = new PullRemoteChanges(transport, cursorStore, [applier]);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.applied).toBe(1);
    }
    expect(applier.applied).toHaveLength(1);
    expect(await cursorStore.load()).toBe("cursor-2");
  });

  it("ignora los cambios de una entity sin applier registrado (UNSUPPORTED_ENTITY local) sin fallar toda la sincronización", async () => {
    const transport = new FakeSyncTransportPort();
    transport.nextPullResult = ok({
      changes: [{ entity: "workoutSession", op: "upsert", id: "w1", updatedAt: "2026-09-22T10:00:00Z", data: {} }],
      nextCursor: "cursor-3",
      hasMore: false,
    });
    const useCase = new PullRemoteChanges(transport, new FakeCursorStore(), []);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.applied).toBe(0);
    }
  });

  it("propaga el error si el transporte falla (sin red)", async () => {
    const transport = new FakeSyncTransportPort();
    transport.nextPullResult = err({ kind: "NETWORK_ERROR" });
    const useCase = new PullRemoteChanges(transport, new FakeCursorStore(), []);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(false);
  });

  it("propaga el error si un applier falla al aplicar un cambio (sin avanzar el cursor)", async () => {
    const transport = new FakeSyncTransportPort();
    transport.nextPullResult = ok({
      changes: [{ entity: "profile", op: "upsert", id: "p1", updatedAt: "2026-09-22T10:00:00Z", data: {} }],
      nextCursor: "cursor-4",
      hasMore: false,
    });
    const cursorStore = new FakeCursorStore();
    const failingApplier: SyncEntityApplier = {
      supports: (entity) => entity === "profile",
      apply: async () => err({ kind: "STORAGE_ERROR" }),
    };
    const useCase = new PullRemoteChanges(transport, cursorStore, [failingApplier]);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(false);
    expect(await cursorStore.load()).toBeNull();
  });
});
