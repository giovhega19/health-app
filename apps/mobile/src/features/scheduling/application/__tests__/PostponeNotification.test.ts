/**
 * CA-04.05.1 Posponer: "Cuando pulso 'Posponer 30 min' en la notificación
 * START, entonces se programa una nueva notificación START 30 min después
 * y el conteo de pospuestos del día aumenta (máximo 3)."
 *
 * `PostponeNotification.execute` (tarea `F04-T08`) lanza deliberadamente —
 * rojo TDD esperado.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { PostponeNotification } from "../PostponeNotification";
import { FakePostponeCounterRepository } from "@test/fakes/FakePostponeCounterRepository";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";

const SLOT_ID = asId("00000000-0000-4000-e200-000000000008");
const TODAY = "2026-09-21";

function buildUseCase(countSoFar: number) {
  const postponeCounterRepository = new FakePostponeCounterRepository([
    { date: TODAY, scheduleSlotId: SLOT_ID, count: countSoFar },
  ]);
  const notificationScheduler = new FakeNotificationScheduler();
  const eventBus = new FakeEventBus();
  const clock = new FakeClock(`${TODAY}T18:00:00Z`);
  const useCase = new PostponeNotification({ postponeCounterRepository, notificationScheduler, eventBus, clock });
  return { useCase, postponeCounterRepository, notificationScheduler, eventBus };
}

describe("CA-04.05.1 PostponeNotification — máximo 3 pospuestos por día", () => {
  it.each([
    { attempt: "1º", countBefore: 0, shouldSucceed: true },
    { attempt: "2º", countBefore: 1, shouldSucceed: true },
    { attempt: "3º", countBefore: 2, shouldSucceed: true },
    { attempt: "4º", countBefore: 3, shouldSucceed: false },
  ])(
    "$attempt intento del día (contador en $countBefore) -> ¿se permite? $shouldSucceed",
    async ({ countBefore, shouldSucceed }) => {
      const { useCase, notificationScheduler } = buildUseCase(countBefore);

      const result = await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

      if (shouldSucceed) {
        expect(isOk(result)).toBe(true);
        expect(notificationScheduler.scheduledCalls).toHaveLength(1);
      } else {
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toEqual(
            expect.objectContaining({ kind: "POSTPONE_LIMIT_REACHED", postponeCountToday: 3 }),
          );
        }
        expect(notificationScheduler.scheduledCalls).toHaveLength(0);
      }
    },
  );

  it("una nueva notificación START pospuesta 30 min se programa 30 min después de ahora", async () => {
    const { useCase, notificationScheduler } = buildUseCase(0);

    await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

    expect(notificationScheduler.scheduledCalls[0]?.fireAt.toISOString()).toBe("2026-09-21T18:30:00.000Z");
  });

  it("emite NotificationPostponed con el conteo actualizado", async () => {
    const { useCase, eventBus } = buildUseCase(1);

    await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

    const events = eventBus.eventsOfType("NotificationPostponed");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { postponeCountToday: number }).postponeCountToday).toBe(2);
  });
});
