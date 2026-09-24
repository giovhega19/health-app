/**
 * `ReplanNotificationWindow` — pruebas adicionales de cobertura (Art. 3.2):
 * el camino feliz completo (programa PRE_REMINDER/START/EXPECTED_END nuevos,
 * generando el contenido de cada tipo vía `notificationBody`) y las ramas de
 * error de cada dependencia (`execute` y `cancelExpectedEnd`).
 */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ReplanNotificationWindow } from "../ReplanNotificationWindow";
import type {
  NotificationError,
  PlannedNotificationRepository,
  RepositoryError,
  ScheduleSlotRepository,
  SchedulingPreferencesRepository,
} from "../ports";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakePlannedNotificationRepository } from "@test/fakes/FakePlannedNotificationRepository";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakePostponeCounterRepository } from "@test/fakes/FakePostponeCounterRepository";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../../domain/SchedulingPreferences";

const ROUTINE_ID = asId("00000000-0000-4000-e100-000000000040");
const SLOT_ID = asId("00000000-0000-4000-e200-000000000040");

function buildHappyPathDeps() {
  const routine = aRoutineSummary({ id: ROUTINE_ID, name: "Full body" });
  const slot = aScheduleSlot({ id: SLOT_ID, routineId: ROUTINE_ID, daysOfWeek: [1], now: new Date("2026-09-21T00:00:00Z") });
  const scheduleSlotRepository = new FakeScheduleSlotRepository([slot]);
  const plannedNotificationRepository = new FakePlannedNotificationRepository();
  const notificationScheduler = new FakeNotificationScheduler();
  const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
  routineSummaryLookupPort.register(routine);
  const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository({
    ...DEFAULT_SCHEDULING_PREFERENCES,
    quietHours: null,
  });

  return {
    scheduleSlotRepository,
    plannedNotificationRepository,
    notificationScheduler,
    routineSummaryLookupPort,
    schedulingPreferencesRepository,
    postponeCounterRepository: new FakePostponeCounterRepository(),
    clock: new FakeClock("2026-09-21T00:00:00Z"),
  };
}

describe("ReplanNotificationWindow.execute — camino feliz completo", () => {
  it("programa PRE_REMINDER, START y EXPECTED_END nuevos con su contenido", async () => {
    const deps = buildHappyPathDeps();
    const useCase = new ReplanNotificationWindow(deps);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.scheduled).toBe(3);
    expect(result.value.cancelled).toBe(0);
    expect(deps.notificationScheduler.scheduledCalls.map((call) => call.type).sort()).toEqual(
      ["EXPECTED_END", "PRE_REMINDER", "START"].sort(),
    );
    for (const call of deps.notificationScheduler.scheduledCalls) {
      expect(call.body.length).toBeGreaterThan(0);
      expect(call.deepLink).toContain(SLOT_ID);
    }
  });

  it("no reprograma notificaciones que ya están correctamente programadas (idempotente)", async () => {
    const deps = buildHappyPathDeps();
    const useCase = new ReplanNotificationWindow(deps);

    await useCase.execute();
    deps.notificationScheduler.scheduledCalls.length = 0;
    const second = await useCase.execute();

    expect(isOk(second)).toBe(true);
    if (!isOk(second)) return;
    expect(second.value.scheduled).toBe(0);
    expect(deps.notificationScheduler.scheduledCalls).toHaveLength(0);
  });
});

describe("ReplanNotificationWindow.execute — ramas de error", () => {
  it("propaga el error al listar los slots activos", async () => {
    const deps = buildHappyPathDeps();
    const failing: ScheduleSlotRepository = {
      save: async () => ok(undefined),
      findById: async () => ok(null),
      cancel: async () => ok(undefined),
      listActive: async (): Promise<Result<never[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never[], RepositoryError>,
      clear: async () => ok(undefined),
    };
    const useCase = new ReplanNotificationWindow({ ...deps, scheduleSlotRepository: failing });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error al cargar las preferencias", async () => {
    const deps = buildHappyPathDeps();
    const failing: SchedulingPreferencesRepository = {
      load: async (): Promise<Result<never, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never, RepositoryError>,
      save: async () => ok(undefined),
    };
    const useCase = new ReplanNotificationWindow({ ...deps, schedulingPreferencesRepository: failing });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error al listar las notificaciones ya programadas", async () => {
    const deps = buildHappyPathDeps();
    const failing: PlannedNotificationRepository = {
      listAll: async (): Promise<Result<never[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never[], RepositoryError>,
      replaceAll: async () => ok(undefined),
    };
    const useCase = new ReplanNotificationWindow({ ...deps, plannedNotificationRepository: failing });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error al reemplazar las notificaciones planificadas", async () => {
    const deps = buildHappyPathDeps();
    const failing: PlannedNotificationRepository = {
      listAll: async () => ok([]),
      replaceAll: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
    };
    const useCase = new ReplanNotificationWindow({ ...deps, plannedNotificationRepository: failing });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});

describe("ReplanNotificationWindow.cancelExpectedEnd — ramas de error", () => {
  it("propaga el error al listar las notificaciones planificadas", async () => {
    const deps = buildHappyPathDeps();
    const failing: PlannedNotificationRepository = {
      listAll: async (): Promise<Result<never[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<never[], RepositoryError>,
      replaceAll: async () => ok(undefined),
    };
    const useCase = new ReplanNotificationWindow({ ...deps, plannedNotificationRepository: failing });

    const result = await useCase.cancelExpectedEnd(SLOT_ID);

    expect(isErr(result)).toBe(true);
  });

  it("devuelve UNKNOWN cuando el NotificationScheduler falla al cancelar", async () => {
    const deps = buildHappyPathDeps();
    deps.plannedNotificationRepository.records.push({
      scheduleSlotId: SLOT_ID,
      routineId: ROUTINE_ID,
      routineName: "Full body",
      type: "EXPECTED_END",
      fireAt: new Date("2026-09-21T19:10:00Z"),
      osNotificationId: "os-1",
      delivered: false,
    });
    const failingScheduler = {
      requestPermission: async () => ok("GRANTED" as const),
      getPermissionStatus: async () => "GRANTED" as const,
      schedule: async () => ok("os-x"),
      cancelAll: async () => ok(undefined),
      cancel: async (): Promise<Result<void, NotificationError>> =>
        ({ ok: false, error: { kind: "UNKNOWN" } }) as Result<void, NotificationError>,
    };
    const useCase = new ReplanNotificationWindow({ ...deps, notificationScheduler: failingScheduler });

    const result = await useCase.cancelExpectedEnd(SLOT_ID);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("UNKNOWN");
    }
  });
});
