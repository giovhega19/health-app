/**
 * `CancelSlot` — CA-04.01.2 "Reprogramación coherente": cierre de brecha
 * H2-QA (ningún caso de uso de producción publicaba `SlotCancelled`; solo lo
 * hacía `ScheduleSlotSyncEntityApplier` al aplicar un `delete` remoto).
 */
import { isErr, isOk } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import type { RepositoryError, ScheduleSlotRepository } from "../ports";
import { CancelSlot } from "../CancelSlot";

describe("CA-04.01.2 CancelSlot", () => {
  it("persiste el slot como cancelado (borrado lógico) y publica SlotCancelled", async () => {
    const slot = aScheduleSlot({ id: asId("00000000-0000-4000-e200-000000000099") });
    const scheduleSlotRepository = new FakeScheduleSlotRepository([slot]);
    const eventBus = new FakeEventBus();
    const useCase = new CancelSlot({
      scheduleSlotRepository,
      eventBus,
      clock: new FakeClock("2026-09-24T09:00:00Z"),
    });

    const result = await useCase.execute(slot.id);

    expect(isOk(result)).toBe(true);

    const reloaded = await scheduleSlotRepository.findById(slot.id);
    expect(isOk(reloaded)).toBe(true);
    if (isOk(reloaded)) {
      expect(reloaded.value?.active).toBe(false);
    }

    const events = eventBus.eventsOfType("SlotCancelled");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { scheduleSlotId: string }).scheduleSlotId).toBe(slot.id);
  });

  it("propaga el error del repositorio sin publicar el evento", async () => {
    const failing: ScheduleSlotRepository = {
      save: async () => ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never, RepositoryError>,
      findById: async () => ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never, RepositoryError>,
      cancel: async () => ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      clear: async () => ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
    };
    const eventBus = new FakeEventBus();
    const useCase = new CancelSlot({
      scheduleSlotRepository: failing,
      eventBus,
      clock: new FakeClock("2026-09-24T09:00:00Z"),
    });

    const result = await useCase.execute(asId("00000000-0000-4000-e200-000000000098"));

    expect(isErr(result)).toBe(true);
    expect(eventBus.eventsOfType("SlotCancelled")).toHaveLength(0);
  });
});
