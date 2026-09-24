/**
 * CA-04.01.2 Reprogramación coherente: "Cuando edito o elimino un
 * ScheduleSlot o su rutina, entonces todas las notificaciones futuras
 * asociadas se cancelan y se reprograman." (ADR-010 "Decisión", disparador
 * 2: "tras cualquier cambio de programación local").
 *
 * `ReplanNotificationWindow.execute` (tarea `F04-T08`) lanza deliberadamente
 * — rojo TDD esperado.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ReplanNotificationWindow } from "../ReplanNotificationWindow";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakePlannedNotificationRepository } from "@test/fakes/FakePlannedNotificationRepository";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakePostponeCounterRepository } from "@test/fakes/FakePostponeCounterRepository";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";

describe("CA-04.01.2 ReplanNotificationWindow — reprogramación al cancelar un slot", () => {
  it("un ScheduleSlot cancelado ya no tiene notificaciones futuras: se cancelan las obsoletas en el SO y no se reprograman", async () => {
    const routine = aRoutineSummary({ id: asId("00000000-0000-4000-e100-000000000005") });
    const cancelledSlot = aScheduleSlot({
      id: asId("00000000-0000-4000-e200-000000000006"),
      routineId: routine.id,
    }).cancel(new Date("2026-09-21T09:00:00Z"));

    const scheduleSlotRepository = new FakeScheduleSlotRepository([cancelledSlot]);
    const plannedNotificationRepository = new FakePlannedNotificationRepository([
      {
        scheduleSlotId: cancelledSlot.id,
        routineId: routine.id,
        routineName: routine.name,
        type: "PRE_REMINDER",
        fireAt: new Date("2026-09-21T17:45:00Z"),
        osNotificationId: "os-obsolete-1",
        delivered: false,
      },
    ]);
    const notificationScheduler = new FakeNotificationScheduler();
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(routine);

    const useCase = new ReplanNotificationWindow({
      scheduleSlotRepository,
      plannedNotificationRepository,
      notificationScheduler,
      routineSummaryLookupPort,
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      postponeCounterRepository: new FakePostponeCounterRepository(),
      clock: new FakeClock("2026-09-21T09:00:00Z"),
    });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    expect(notificationScheduler.cancelledIds).toContain("os-obsolete-1");

    const remaining = await plannedNotificationRepository.listAll();
    expect(isOk(remaining)).toBe(true);
    if (isOk(remaining)) {
      expect(remaining.value.some((n) => n.scheduleSlotId === cancelledSlot.id)).toBe(false);
    }
  });
});
