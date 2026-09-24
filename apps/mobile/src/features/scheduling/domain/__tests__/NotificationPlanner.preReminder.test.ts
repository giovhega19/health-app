/**
 * CA-04.02.1 Recordatorio previo (`spec.md`): "Dado un slot a las 18:00 con
 * reminderOffsetMin = 15, entonces se programa una notificación local
 * PRE_REMINDER a las 17:45 con el nombre de la rutina y la mascota." (la
 * referencia a "la mascota" es contenido de la notificación —
 * `infrastructure/ExpoNotificationScheduler`, F04-T11 — aquí solo se
 * verifica el cálculo puro de `fireAt`/`routineName`, dominio).
 *
 * `NotificationPlanner.planNotifications` (tarea `F04-T06`) lanza
 * deliberadamente "not implemented" — rojo TDD esperado: esta prueba falla
 * porque la excepción interrumpe la ejecución antes de llegar a las
 * aserciones (el motivo correcto: la lógica de negocio no existe todavía).
 */
import { planNotifications } from "../NotificationPlanner";
import type { NotificationPlannerInput } from "../NotificationPlanner";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../SchedulingPreferences";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";

const NOW = new Date("2026-09-21T00:00:00Z"); // lunes, antes de cualquier hora del día

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

describe("CA-04.02.1 NotificationPlanner — PRE_REMINDER", () => {
  it.each([
    { startTime: "18:00", offset: 15, expectedFireAt: "2026-09-21T17:45:00.000Z" },
    { startTime: "18:00", offset: 30, expectedFireAt: "2026-09-21T17:30:00.000Z" },
    { startTime: "07:00", offset: 10, expectedFireAt: "2026-09-21T06:50:00.000Z" },
  ])(
    "slot a las $startTime con reminderOffsetMin=$offset -> PRE_REMINDER a las $expectedFireAt",
    ({ startTime, offset, expectedFireAt }) => {
      const routine = aRoutineSummary({ name: "Pecho y flexiones" });
      const slot = aScheduleSlot({
        routineId: routine.id,
        daysOfWeek: [1],
        startTime,
        reminderOffsetMin: offset,
        now: NOW,
      });

      const result = planNotifications(baseInput({ slots: [slot], routineSummaries: [routine] }));

      const preReminder = result.find((n) => n.type === "PRE_REMINDER" && n.scheduleSlotId === slot.id);
      expect(preReminder).toBeDefined();
      expect(preReminder?.fireAt.toISOString()).toBe(expectedFireAt);
      expect(preReminder?.routineName).toBe("Pecho y flexiones");
    },
  );
});
