/**
 * `purgeLocalDataOnAccountDeletion` (hallazgo de seguridad H2 "Eliminar
 * cuenta no purga datos locales de rutinas/horarios ni cancela
 * notificaciones"). Verifica, con fakes (sin SQLite/red), que tras
 * eliminar la cuenta `RoutineRepository`/`CustomExerciseRepository`/
 * `ScheduleSlotRepository`/`PlannedNotificationRepository` quedan vacíos y
 * `NotificationScheduler.cancelAll()` fue invocado — el mismo cableado real
 * vive en `composition/container.ts`, suscrito al evento `AccountDeleted`
 * que publica `features/profile/application/DeleteAccount.ts`.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { Routine } from "@/features/routines/domain/Routine";
import { purgeLocalDataOnAccountDeletion } from "../purgeLocalDataOnAccountDeletion";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { FakeCustomExerciseRepository } from "@test/fakes/FakeCustomExerciseRepository";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakePlannedNotificationRepository } from "@test/fakes/FakePlannedNotificationRepository";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { aRoutine } from "@test/fakes/aRoutine";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";

describe("hallazgo H2 purgeLocalDataOnAccountDeletion", () => {
  it("vacía rutinas, ejercicios personalizados, horarios y notificaciones planificadas, y cancela las del SO", async () => {
    const seededRoutine = Routine.create(aRoutine().build());
    if (!seededRoutine.ok) throw new Error("fixture inválido");
    const userRoutineRepository = new FakeRoutineRepository([seededRoutine.value]);
    const customExerciseRepository = new FakeCustomExerciseRepository();
    const scheduleSlotRepository = new FakeScheduleSlotRepository([aScheduleSlot()]);
    const plannedNotificationRepository = new FakePlannedNotificationRepository([
      {
        scheduleSlotId: asId("00000000-0000-4000-9999-000000000099"),
        routineId: asId("00000000-0000-4000-9999-000000000098"),
        routineName: "Rutina de prueba",
        type: "PRE_REMINDER",
        fireAt: new Date("2026-09-24T18:00:00Z"),
        osNotificationId: "os-notification-1",
        delivered: false,
      },
    ]);
    const notificationScheduler = new FakeNotificationScheduler();

    // Precondición: hay datos que purgar.
    const routinesBefore = await userRoutineRepository.listActive();
    expect(isOk(routinesBefore) && routinesBefore.value).toHaveLength(1);
    const slotsBefore = await scheduleSlotRepository.listActive();
    expect(isOk(slotsBefore) && slotsBefore.value).toHaveLength(1);
    expect(plannedNotificationRepository.records).toHaveLength(1);

    await purgeLocalDataOnAccountDeletion({
      userRoutineRepository,
      customExerciseRepository,
      scheduleSlotRepository,
      plannedNotificationRepository,
      notificationScheduler,
    });

    expect(userRoutineRepository.clearCalls).toBe(1);
    const routinesAfter = await userRoutineRepository.listActive();
    expect(isOk(routinesAfter) && routinesAfter.value).toEqual([]);

    expect(customExerciseRepository.clearCalls).toBe(1);

    expect(scheduleSlotRepository.clearCalls).toBe(1);
    const slotsAfter = await scheduleSlotRepository.listActive();
    expect(isOk(slotsAfter) && slotsAfter.value).toEqual([]);

    expect(plannedNotificationRepository.records).toEqual([]);

    expect(notificationScheduler.cancelAllCalls).toBe(1);
  });
});
