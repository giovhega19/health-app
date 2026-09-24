/**
 * `NotificationPlanner` — pruebas adicionales de cobertura (Art. 3.2) para
 * ramas que las suites de QA no ejercitan: un slot inactivo, un slot cuya
 * rutina no está en `routineSummaries`, y los casos de `isWithinQuietHours`
 * con horario que no cruza medianoche y con `start === end` (degenerado).
 */
import { planNotifications, isWithinQuietHours } from "../NotificationPlanner";
import type { NotificationPlannerInput } from "../NotificationPlanner";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../SchedulingPreferences";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";

const NOW = new Date("2026-09-21T00:00:00Z");

function baseInput(overrides: Partial<NotificationPlannerInput> = {}): NotificationPlannerInput {
  return {
    slots: [],
    routineSummaries: [],
    preferences: { ...DEFAULT_SCHEDULING_PREFERENCES, quietHours: null },
    postponeCounters: [],
    notificationsAlreadyCountedToday: 0,
    now: NOW,
    ...overrides,
  };
}

describe("planNotifications — slots ignorados", () => {
  it("ignora un slot inactivo (cancelado)", () => {
    const routine = aRoutineSummary();
    const slot = aScheduleSlot({ routineId: routine.id, daysOfWeek: [1], now: NOW }).cancel(NOW);

    const result = planNotifications(baseInput({ slots: [slot], routineSummaries: [routine] }));

    expect(result).toHaveLength(0);
  });

  it("ignora un slot cuya rutina no está en routineSummaries", () => {
    const routine = aRoutineSummary();
    const slot = aScheduleSlot({ routineId: routine.id, daysOfWeek: [1], now: NOW });

    const result = planNotifications(baseInput({ slots: [slot], routineSummaries: [] }));

    expect(result).toHaveLength(0);
  });
});

describe("isWithinQuietHours — casos adicionales", () => {
  it("horario que no cruza medianoche (13:00-15:00): dentro a las 14:00, fuera a las 16:00", () => {
    const quietHours = { start: "13:00", end: "15:00" };
    expect(isWithinQuietHours(new Date("2026-09-21T14:00:00Z"), quietHours)).toBe(true);
    expect(isWithinQuietHours(new Date("2026-09-21T16:00:00Z"), quietHours)).toBe(false);
  });

  it("start === end (degenerado): nunca está dentro", () => {
    expect(isWithinQuietHours(new Date("2026-09-21T14:00:00Z"), { start: "10:00", end: "10:00" })).toBe(false);
  });
});
