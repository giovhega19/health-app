/**
 * CA-04.03.1 Aviso de fin estimado: "Dado que inicio a las 18:05 una rutina
 * con duración estimada de 65 min, entonces se programa EXPECTED_END a las
 * 19:10." El campo `activeSessionStarts` es una extensión de
 * `NotificationPlannerInput` propuesta por `qa-pruebas` para poder expresar
 * este escenario en H2 sin depender de `workout-session` (F05, H3, ver
 * `spec.md` §"Preguntas abiertas").
 *
 * `NotificationPlanner.planNotifications` (tarea `F04-T06`) lanza
 * deliberadamente — rojo TDD esperado.
 */
import { planNotifications } from "../NotificationPlanner";
import type { NotificationPlannerInput } from "../NotificationPlanner";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../SchedulingPreferences";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";

describe("CA-04.03.1 NotificationPlanner — EXPECTED_END", () => {
  it("inicio real a las 18:05, duración estimada 65 min -> EXPECTED_END a las 19:10", () => {
    const routine = aRoutineSummary({ name: "Pecho y flexiones", estimatedDurationSeconds: 65 * 60 });
    const slot = aScheduleSlot({
      routineId: routine.id,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
      now: new Date("2026-09-21T00:00:00Z"),
    });

    const input: NotificationPlannerInput = {
      slots: [slot],
      routineSummaries: [routine],
      preferences: { ...DEFAULT_SCHEDULING_PREFERENCES, quietHours: null },
      postponeCounters: [],
      notificationsAlreadyCountedToday: 0,
      now: new Date("2026-09-21T18:06:00Z"),
      activeSessionStarts: [{ scheduleSlotId: slot.id, actualStartAt: new Date("2026-09-21T18:05:00Z") }],
    };

    const result = planNotifications(input);

    const expectedEnd = result.find((n) => n.type === "EXPECTED_END" && n.scheduleSlotId === slot.id);
    expect(expectedEnd).toBeDefined();
    expect(expectedEnd?.fireAt.toISOString()).toBe("2026-09-21T19:10:00.000Z");
  });

  it("sin un inicio real registrado, EXPECTED_END se calcula sobre la hora programada del slot + duración estimada", () => {
    const routine = aRoutineSummary({ name: "Pecho y flexiones", estimatedDurationSeconds: 65 * 60 });
    const slot = aScheduleSlot({
      routineId: routine.id,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
      now: new Date("2026-09-21T00:00:00Z"),
    });

    const result = planNotifications({
      slots: [slot],
      routineSummaries: [routine],
      preferences: { ...DEFAULT_SCHEDULING_PREFERENCES, quietHours: null },
      postponeCounters: [],
      notificationsAlreadyCountedToday: 0,
      now: new Date("2026-09-21T00:00:00Z"),
    });

    const expectedEnd = result.find((n) => n.type === "EXPECTED_END" && n.scheduleSlotId === slot.id);
    expect(expectedEnd).toBeDefined();
    expect(expectedEnd?.fireAt.toISOString()).toBe("2026-09-21T19:05:00.000Z");
  });
});
