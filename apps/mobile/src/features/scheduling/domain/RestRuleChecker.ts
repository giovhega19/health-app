import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { RoutineSummary } from "./NotificationPlanner";

export interface LastSessionInfo {
  completedAt: Date;
  muscleGroups: MuscleGroup[];
}

export type RestWarning =
  | { kind: "MIN_HOURS_BETWEEN_ROUTINES"; hoursSinceLastSession: number; minHoursRequired: number }
  | {
      kind: "SAME_MUSCLE_GROUP";
      hoursSinceLastSession: number;
      minHoursRequired: number;
      muscleGroups: MuscleGroup[];
      suggestedAlternativeRoutineId: Id | null;
    };

export interface RestRuleInput {
  now: Date;
  targetRoutine: RoutineSummary;
  minHoursBetweenRoutines: number;
  minHoursSameMuscle: number;
  lastSession: LastSessionInfo | null;
  lastSessionSameMuscle: LastSessionInfo | null;
  /**
   * Candidatas para la heurística acotada de CA-04.04.2 (`plan.md` §1 punto
   * 3): otras rutinas que el usuario ya tiene programadas en un
   * `ScheduleSlot` activo para un día distinto. Resueltas por la
   * aplicación (`ScheduleRoutine`), nunca por este servicio de dominio, que
   * "recibe `lastSessionInfo` como parámetro — nunca lee un repositorio"
   * (`plan.md` §2).
   */
  alternativeRoutines: RoutineSummary[];
}

const MS_PER_HOUR = 3_600_000;

function hoursSince(now: Date, past: Date): number {
  return Math.round((now.getTime() - past.getTime()) / MS_PER_HOUR);
}

function sharesMuscleGroup(a: MuscleGroup[], b: MuscleGroup[]): boolean {
  return a.some((muscleGroup) => b.includes(muscleGroup));
}

/**
 * `RestRuleChecker` (RN-13, dominio puro). CA-04.04.1 (tiempo mínimo entre
 * rutinas, no bloqueante) y CA-04.04.2 (mismo grupo muscular + heurística
 * acotada de alternativa, `plan.md` §1 punto 3).
 */
export function checkRestRules(input: RestRuleInput): RestWarning[] {
  const warnings: RestWarning[] = [];

  if (input.minHoursBetweenRoutines > 0 && input.lastSession !== null) {
    const elapsed = hoursSince(input.now, input.lastSession.completedAt);
    if (elapsed < input.minHoursBetweenRoutines) {
      warnings.push({
        kind: "MIN_HOURS_BETWEEN_ROUTINES",
        hoursSinceLastSession: elapsed,
        minHoursRequired: input.minHoursBetweenRoutines,
      });
    }
  }

  if (
    input.minHoursSameMuscle > 0 &&
    input.lastSessionSameMuscle !== null &&
    sharesMuscleGroup(input.targetRoutine.muscleGroups, input.lastSessionSameMuscle.muscleGroups)
  ) {
    const elapsed = hoursSince(input.now, input.lastSessionSameMuscle.completedAt);
    if (elapsed < input.minHoursSameMuscle) {
      const alternative = input.alternativeRoutines.find(
        (routine) => !sharesMuscleGroup(routine.muscleGroups, input.targetRoutine.muscleGroups),
      );
      warnings.push({
        kind: "SAME_MUSCLE_GROUP",
        hoursSinceLastSession: elapsed,
        minHoursRequired: input.minHoursSameMuscle,
        muscleGroups: input.targetRoutine.muscleGroups,
        suggestedAlternativeRoutineId: alternative?.id ?? null,
      });
    }
  }

  return warnings;
}
