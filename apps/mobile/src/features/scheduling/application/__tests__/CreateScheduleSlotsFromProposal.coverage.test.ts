/**
 * `CreateScheduleSlotsFromProposal` — rama de cobertura (Art. 3.2) cuando
 * `ScheduleSlot.create` rechaza una entrada (p. ej. `preferredTime` con
 * formato inválido): se omite y se continúa con el resto del lote.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { CreateScheduleSlotsFromProposal } from "../CreateScheduleSlotsFromProposal";

describe("CreateScheduleSlotsFromProposal — entrada inválida", () => {
  it("omite una entrada con preferredTime inválido y crea el resto del lote", async () => {
    const repository = new FakeScheduleSlotRepository();
    const useCase = new CreateScheduleSlotsFromProposal(repository, new FakeEventBus(), new FakeClock("2026-09-21T08:00:00Z"));

    const result = await useCase.execute({
      routines: [
        { routineId: asId("00000000-0000-4000-e100-000000000060"), dayNumber: 1, preferredTime: "no-es-una-hora" },
        { routineId: asId("00000000-0000-4000-e100-000000000061"), dayNumber: 2, preferredTime: "07:00" },
      ],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.createdCount).toBe(1);
    expect(repository.saved).toHaveLength(1);
  });
});
