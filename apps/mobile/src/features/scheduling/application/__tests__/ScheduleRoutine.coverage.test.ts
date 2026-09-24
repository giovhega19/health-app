/**
 * `ScheduleRoutine` — pruebas adicionales de cobertura (Art. 3.2) para las
 * ramas de error de cada dependencia y la validación de `ScheduleSlot`.
 */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ScheduleRoutine } from "../ScheduleRoutine";
import type { LookupError, RepositoryError, RoutineSummaryLookupPort, ScheduleSlotRepository } from "../ports";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeLastSessionQueryPort } from "@test/fakes/FakeLastSessionQueryPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import type { RoutineSummary } from "../../domain/NotificationPlanner";

const ROUTINE_ID = asId("00000000-0000-4000-e100-000000000030");

describe("ScheduleRoutine — ramas de error", () => {
  it("devuelve NOT_FOUND cuando la rutina no existe", async () => {
    const useCase = new ScheduleRoutine({
      scheduleSlotRepository: new FakeScheduleSlotRepository(),
      routineSummaryLookupPort: new FakeRoutineSummaryLookupPort(),
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NOT_FOUND");
    }
  });

  it("propaga el error al cargar las preferencias", async () => {
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID }));
    const failingPreferences = {
      load: async (): Promise<Result<never, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never, RepositoryError>,
      save: async () => ok(undefined),
    };
    const useCase = new ScheduleRoutine({
      scheduleSlotRepository: new FakeScheduleSlotRepository(),
      routineSummaryLookupPort,
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: failingPreferences,
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(true);
  });

  it("devuelve INVALID_SLOT cuando el horario no es válido", async () => {
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID }));
    const useCase = new ScheduleRoutine({
      scheduleSlotRepository: new FakeScheduleSlotRepository(),
      routineSummaryLookupPort,
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "no-es-una-hora",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("INVALID_SLOT");
    }
  });

  it("propaga el error del repositorio al guardar el slot", async () => {
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID }));
    const failingRepository: ScheduleSlotRepository = {
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([]),
      findById: async () => ok(null),
      cancel: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new ScheduleRoutine({
      scheduleSlotRepository: failingRepository,
      routineSummaryLookupPort,
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(true);
  });

  it("si listActive falla al buscar alternativas, no bloquea: se programa igual sin alternativas", async () => {
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID }));
    const failingListActive: ScheduleSlotRepository = {
      save: async () => ok(undefined),
      listActive: async (): Promise<Result<never[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never[], RepositoryError>,
      findById: async () => ok(null),
      cancel: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new ScheduleRoutine({
      scheduleSlotRepository: failingListActive,
      routineSummaryLookupPort,
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(false);
  });

  it("descarta candidatas a alternativa que el propio lookup no puede resolver", async () => {
    const routineSummaryLookupPort: RoutineSummaryLookupPort = {
      summarize: async (id): Promise<Result<RoutineSummary, LookupError>> =>
        id === ROUTINE_ID
          ? ok(aRoutineSummary({ id: ROUTINE_ID }))
          : ({ ok: false, error: { kind: "NOT_FOUND" } } as Result<RoutineSummary, LookupError>),
    };
    const otherRoutineId = asId("00000000-0000-4000-e100-000000000031");
    const scheduleSlotRepository = new FakeScheduleSlotRepository([
      aScheduleSlot({
        id: asId("00000000-0000-4000-e200-000000000031"),
        routineId: otherRoutineId,
        daysOfWeek: [3],
      }),
    ]);

    const useCase = new ScheduleRoutine({
      scheduleSlotRepository,
      routineSummaryLookupPort,
      lastSessionQueryPort: new FakeLastSessionQueryPort(),
      schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T08:00:00Z"),
    });

    const result = await useCase.execute({
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isErr(result)).toBe(false);
  });
});
