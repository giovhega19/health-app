/**
 * CA-04.03.1 (segunda mitad): "...y si termino la sesión antes, EXPECTED_END
 * se cancela." Expuesto como un método dedicado
 * `ReplanNotificationWindow.cancelExpectedEnd(scheduleSlotId)` — propuesta
 * de `qa-pruebas` para expresar este escenario en H2 sin `workout-session`
 * (F05, H3): se invocaría desde el mecanismo local que registre "la sesión
 * terminó" (p. ej. la pantalla placeholder de sesión), sustituido sin
 * romper el contrato cuando F05 exista (mismo patrón que el resto de F04).
 *
 * `ReplanNotificationWindow.cancelExpectedEnd` (tarea `F04-T08`) lanza
 * deliberadamente — rojo TDD esperado.
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

describe("CA-04.03.1 ReplanNotificationWindow — cancela EXPECTED_END si la sesión termina antes", () => {
  it("cancela la notificación EXPECTED_END pendiente del slot cuya sesión ya terminó", async () => {
    const routine = aRoutineSummary({ id: asId("00000000-0000-4000-e100-000000000006") });
    const slot = aScheduleSlot({ id: asId("00000000-0000-4000-e200-000000000007"), routineId: routine.id });

    const plannedNotificationRepository = new FakePlannedNotificationRepository([
      {
        scheduleSlotId: slot.id,
        routineId: routine.id,
        routineName: routine.name,
        type: "EXPECTED_END",
        fireAt: new Date("2026-09-21T19:10:00Z"),
        osNotificationId: "os-expected-end-1",
        delivered: false,
      },
    ]);
    const notificationScheduler = new FakeNotificationScheduler();

    const useCase = new ReplanNotificationWindow({
      scheduleSlotRepository: new FakeScheduleSlotRepository([slot]),
      plannedNotificationRepository,
      notificationScheduler,
      routineSummaryLookupPort: new FakeRoutineSummaryLookupPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      postponeCounterRepository: new FakePostponeCounterRepository(),
      clock: new FakeClock("2026-09-21T18:40:00Z"),
    });

    const result = await useCase.cancelExpectedEnd(slot.id);

    expect(isOk(result)).toBe(true);
    expect(notificationScheduler.cancelledIds).toContain("os-expected-end-1");
  });
});
