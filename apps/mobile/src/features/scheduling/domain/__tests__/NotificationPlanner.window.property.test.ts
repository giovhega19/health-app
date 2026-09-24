/**
 * ADR-010 "Ventana móvil de 7 días para notificaciones locales, con
 * replanificación al abrir la app": ninguna `PlannedNotification` calculada
 * por `NotificationPlanner.planNotifications` cae fuera de `[now, now+7d]`,
 * y nunca se supera el límite documentado de 64 notificaciones locales
 * pendientes de iOS (ADR-010 "Investigación del límite real del sistema
 * operativo"). Basada en propiedades (`fast-check`), como pide
 * `specs/F04-programacion-recordatorios/plan.md` §5.
 *
 * `planNotifications` (tarea `F04-T06`) lanza deliberadamente — rojo TDD.
 */
import fc from "fast-check";
import { IOS_MAX_PENDING_NOTIFICATIONS, PLANNING_WINDOW_DAYS, planNotifications } from "../NotificationPlanner";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../SchedulingPreferences";
import type { DayOfWeek } from "../ScheduleSlot";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { asId } from "@/shared/domain/Id";

const NOW = new Date("2026-09-21T00:00:00Z");
const WINDOW_END = new Date(NOW.getTime() + PLANNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

function idFor(namespace: string, n: number) {
  return asId(`00000000-0000-4000-${namespace}-${n.toString().padStart(12, "0")}`);
}

describe("ADR-010 NotificationPlanner — ventana móvil de 7 días (propiedades)", () => {
  it("nunca programa una notificación con fireAt fuera de [now, now+7d] ni excede el límite de iOS", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            days: fc.uniqueArray(fc.integer({ min: 1, max: 7 }), { minLength: 1, maxLength: 7 }),
            hour: fc.integer({ min: 0, max: 23 }),
            minute: fc.integer({ min: 0, max: 59 }),
            offset: fc.integer({ min: 0, max: 60 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (specs) => {
          const built = specs.map((spec, index) => {
            const routine = aRoutineSummary({ id: idFor("e300", index) });
            const startTime = `${String(spec.hour).padStart(2, "0")}:${String(spec.minute).padStart(2, "0")}`;
            const slot = aScheduleSlot({
              id: idFor("e301", index),
              routineId: routine.id,
              daysOfWeek: spec.days as DayOfWeek[],
              startTime,
              reminderOffsetMin: spec.offset,
              now: NOW,
            });
            return { slot, routine };
          });

          const result = planNotifications({
            slots: built.map((b) => b.slot),
            routineSummaries: built.map((b) => b.routine),
            preferences: { ...DEFAULT_SCHEDULING_PREFERENCES, quietHours: null, maxNotificationsPerDay: 1000 },
            postponeCounters: [],
            notificationsAlreadyCountedToday: 0,
            now: NOW,
          });

          for (const notification of result) {
            expect(notification.fireAt.getTime()).toBeGreaterThanOrEqual(NOW.getTime());
            expect(notification.fireAt.getTime()).toBeLessThanOrEqual(WINDOW_END.getTime());
          }
          expect(result.length).toBeLessThanOrEqual(IOS_MAX_PENDING_NOTIFICATIONS);
        },
      ),
      { numRuns: 50 },
    );
  });
});
