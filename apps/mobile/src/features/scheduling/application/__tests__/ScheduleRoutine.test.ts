/**
 * CA-04.01.1 Programar recurrencia: "Cuando asigno 'Pecho y flexiones' a
 * lunes y jueves a las 18:00, entonces se crea un ScheduleSlot activo... y
 * los días sin programación se muestran como 'Descanso'" (el calendario
 * semanal/"Descanso" es una vista de `presentation`, fuera del alcance de
 * esta prueba de aplicación — se verifica aquí la creación del agregado y
 * el evento de dominio).
 *
 * Incluye también CA-04.04.1 (RN-13) como advertencia no bloqueante
 * devuelta por el mismo caso de uso (`plan.md` §2: "calcula advertencia
 * RN-13"), y una prueba de que `RoutineScheduled` trae los datos necesarios
 * para que `composition/container.ts` lo encole en `sync` (mismo patrón que
 * `ProfileUpdated`/`BodyWeightLogged`, F01;
 * `specs/F04-programacion-recordatorios/plan.md` §3 tabla de eventos).
 *
 * `ScheduleRoutine.execute` (tarea `F04-T08`) lanza deliberadamente — rojo
 * TDD esperado.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ScheduleRoutine } from "../ScheduleRoutine";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeLastSessionQueryPort } from "@test/fakes/FakeLastSessionQueryPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";

function buildUseCase(nowIso = "2026-09-21T08:00:00Z") {
  const routine = aRoutineSummary({ id: asId("00000000-0000-4000-e100-000000000002"), name: "Pecho y flexiones" });
  const scheduleSlotRepository = new FakeScheduleSlotRepository();
  const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
  routineSummaryLookupPort.register(routine);
  const lastSessionQueryPort = new FakeLastSessionQueryPort();
  const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository();
  const eventBus = new FakeEventBus();
  const clock = new FakeClock(nowIso);

  const useCase = new ScheduleRoutine({
    scheduleSlotRepository,
    routineSummaryLookupPort,
    lastSessionQueryPort,
    schedulingPreferencesRepository,
    eventBus,
    clock,
  });

  return { useCase, routine, scheduleSlotRepository, lastSessionQueryPort, schedulingPreferencesRepository, eventBus };
}

describe("CA-04.01.1 ScheduleRoutine", () => {
  it("asigna 'Pecho y flexiones' a lunes y jueves a las 18:00 -> ScheduleSlot activo con ambos días", async () => {
    const { useCase, routine, scheduleSlotRepository } = buildUseCase();

    const result = await useCase.execute({
      routineId: routine.id,
      daysOfWeek: [1, 4],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isOk(result)).toBe(true);
    expect(scheduleSlotRepository.saved).toHaveLength(1);
    expect(scheduleSlotRepository.saved[0]?.active).toBe(true);
    expect(scheduleSlotRepository.saved[0]?.daysOfWeek).toEqual([1, 4]);
  });

  it("emite RoutineScheduled con los datos necesarios para encolarlo en sync (entity 'scheduleSlot')", async () => {
    const { useCase, routine, eventBus } = buildUseCase();

    await useCase.execute({ routineId: routine.id, daysOfWeek: [1, 4], startTime: "18:00", reminderOffsetMin: 15 });

    const events = eventBus.eventsOfType("RoutineScheduled");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { routineId: string }).routineId).toBe(routine.id);
    expect((events[0] as unknown as { daysOfWeek: number[] }).daysOfWeek).toEqual([1, 4]);
  });

  it("CA-04.04.1 (RN-13) han pasado 5h desde la última rutina (<12h) -> advertencia no bloqueante, la programación se crea igual", async () => {
    const { useCase, routine, lastSessionQueryPort, schedulingPreferencesRepository, scheduleSlotRepository } =
      buildUseCase("2026-09-21T12:00:00Z");
    lastSessionQueryPort.response = { completedAt: new Date("2026-09-21T07:00:00Z"), muscleGroups: ["CHEST"] };
    schedulingPreferencesRepository.current = {
      ...schedulingPreferencesRepository.current,
      minHoursBetweenRoutines: 12,
    };

    const result = await useCase.execute({
      routineId: routine.id,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.warnings).toContainEqual(
        expect.objectContaining({
          kind: "MIN_HOURS_BETWEEN_ROUTINES",
          hoursSinceLastSession: 5,
          minHoursRequired: 12,
        }),
      );
    }
    expect(scheduleSlotRepository.saved).toHaveLength(1); // no bloquea (RN-13)
  });
});
