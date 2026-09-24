/**
 * Sincronización de `ScheduleSlot`
 * (`specs/F04-programacion-recordatorios/plan.md` §3: "sí se sincroniza
 * ScheduleSlot", mismo pipeline genérico de `sync` que `profile`/
 * `bodyMetric` (F01) y `routine`/`customExercise` (F03) —
 * `packages/api-contract/openapi.yaml` `SyncEntity` ya amplía el enum con
 * `scheduleSlot`). `ScheduleSlotSyncEntityApplier` implementa el SPI
 * `SyncEntityApplier` de `features/sync` (lado *pull*), mismo patrón exacto
 * que `ProfileSyncEntityApplier`.
 *
 * `apply()` (tarea `F04-T10`) lanza deliberadamente para `op: "upsert"` —
 * rojo TDD esperado.
 */
import { isOk } from "@/shared/domain/Result";
import type { RemoteChange } from "@/features/sync";
import { ScheduleSlotSyncEntityApplier } from "../ScheduleSlotSyncEntityApplier";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";

describe("F04 sync — ScheduleSlotSyncEntityApplier", () => {
  it("supports() solo acepta 'scheduleSlot'", () => {
    const applier = new ScheduleSlotSyncEntityApplier(new FakeScheduleSlotRepository());

    expect(applier.supports("scheduleSlot")).toBe(true);
    expect(applier.supports("profile")).toBe(false);
    expect(applier.supports("routine")).toBe(false);
  });

  it("aplica un cambio remoto upsert guardando el ScheduleSlot localmente (LWW por updatedAt, RN-18)", async () => {
    const scheduleSlotRepository = new FakeScheduleSlotRepository();
    const applier = new ScheduleSlotSyncEntityApplier(scheduleSlotRepository);
    const change: RemoteChange = {
      entity: "scheduleSlot",
      op: "upsert",
      id: "00000000-0000-4000-e200-000000000009",
      updatedAt: "2026-09-21T10:00:00Z",
      data: {
        id: "00000000-0000-4000-e200-000000000009",
        routineId: "00000000-0000-4000-e100-000000000001",
        daysOfWeek: [1, 4],
        startTime: "18:00",
        reminderOffsetMin: 15,
        active: true,
      },
    };

    const result = await applier.apply(change);

    expect(isOk(result)).toBe(true);
    expect(scheduleSlotRepository.saved).toHaveLength(1);
    expect(scheduleSlotRepository.saved[0]?.daysOfWeek).toEqual([1, 4]);
  });

  it("un cambio remoto delete cancela el slot localmente (borrado lógico, RN-18)", async () => {
    const scheduleSlotRepository = new FakeScheduleSlotRepository();
    const applier = new ScheduleSlotSyncEntityApplier(scheduleSlotRepository);

    const result = await applier.apply({
      entity: "scheduleSlot",
      op: "delete",
      id: "00000000-0000-4000-e200-000000000009",
      updatedAt: "2026-09-21T10:00:00Z",
    });

    expect(isOk(result)).toBe(true);
  });
});
