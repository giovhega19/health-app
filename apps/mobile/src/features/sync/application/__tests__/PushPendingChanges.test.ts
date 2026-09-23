/**
 * `PushPendingChanges` (ADR-002, tarea `F01-T08`). CA-01.01.1 (invitado ->
 * cuenta sin perder datos) y CA-01.06.1 (registrar peso) dependen de que los
 * cambios locales encolados en el `outbox` se envíen a `POST /sync/push` y se
 * marquen como enviados/fallidos según la respuesta del servidor.
 */
import { asId } from "@/shared/domain/Id";
import { err, isOk, ok } from "@/shared/domain/Result";
import { PushPendingChanges } from "../PushPendingChanges";
import { FakeOutboxRepository } from "@test/fakes/FakeOutboxRepository";
import { FakeSyncTransportPort } from "@test/fakes/FakeSyncTransportPort";

describe("RF-01.01 PushPendingChanges", () => {
  it("no llama a la red si no hay cambios pendientes", async () => {
    const outbox = new FakeOutboxRepository();
    const transport = new FakeSyncTransportPort();
    const useCase = new PushPendingChanges(outbox, transport, "device-1");

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    expect(transport.pushedBatches).toHaveLength(0);
  });

  it("CA-01.06.1 envía los cambios pendientes y los marca como enviados si el servidor los acepta", async () => {
    const outbox = new FakeOutboxRepository();
    await outbox.enqueue("bodyMetric", "upsert", asId("00000000-0000-4000-b000-000000000001"), {
      weightKg: 59.5,
    });
    const transport = new FakeSyncTransportPort();
    const useCase = new PushPendingChanges(outbox, transport, "device-1");

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.pushed).toBe(1);
      expect(result.value.rejected).toBe(0);
    }
    expect(outbox.all()[0]?.status).toBe("sent");
  });

  it("marca como fallidos los cambios rechazados por el servidor, sin perderlos", async () => {
    const outbox = new FakeOutboxRepository();
    const entityId = asId("00000000-0000-4000-b000-000000000002");
    await outbox.enqueue("profile", "upsert", entityId, {});
    const transport = new FakeSyncTransportPort();
    transport.nextPushResult = ok({
      accepted: [],
      rejected: [{ id: entityId, code: "CONFLICT", detail: "versión desactualizada" }],
      serverTime: "2026-09-22T10:00:00Z",
    });
    const useCase = new PushPendingChanges(outbox, transport, "device-1");

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.rejected).toBe(1);
    }
    const entry = outbox.all().find((candidate) => candidate.entityId === entityId);
    expect(entry?.status).toBe("failed");
    expect(entry?.lastError).toBe("versión desactualizada");
  });

  it("propaga el error si el repositorio de outbox falla al leer pending()", async () => {
    const outbox = new FakeOutboxRepository();
    outbox.pending = async () => err({ kind: "STORAGE_ERROR" });
    const useCase = new PushPendingChanges(outbox, new FakeSyncTransportPort(), "device-1");

    const result = await useCase.execute();

    expect(isOk(result)).toBe(false);
  });

  it("propaga el error si el transporte falla (sin red)", async () => {
    const outbox = new FakeOutboxRepository();
    await outbox.enqueue("profile", "upsert", asId("00000000-0000-4000-b000-000000000009"), null);
    const transport = new FakeSyncTransportPort();
    transport.nextPushResult = err({ kind: "NETWORK_ERROR" });
    const useCase = new PushPendingChanges(outbox, transport, "device-1");

    const result = await useCase.execute();

    expect(isOk(result)).toBe(false);
  });
});
