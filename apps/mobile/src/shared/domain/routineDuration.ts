import type { RoutineBlock } from "./RoutineBlock";
import type { TimerSettings } from "./TimerSettings";

/**
 * RN-07 Duración estimada de la rutina (`05-modelo-dominio-reglas.md` §2):
 *
 *   duración = prep
 *            + Σ(ejercicios)[series × tActivo + (series − 1) × descansoSeries]
 *            + (nEjercicios − 1) × descansoEjercicios
 *            + (rondas − 1) × descansoRondas
 *
 * `tActivo` = `targetSeconds` (modo tiempo) o `targetReps × 3 s` (modo reps).
 * En circuitos/superseries no hay descanso entre ejercicios del grupo: solo
 * al final de cada ronda (RN-07). Precedencia de parámetros de tiempo RN-05:
 * `RoutineItem.timerOverrides → Routine.timerDefaults → appDefaults`
 * (las `Preferences` globales llegan más adelante, en el plan técnico de la
 * feature que las gestione; hasta entonces el tercer nivel de precedencia se
 * omite sin romper el orden).
 *
 * Función pura compartida entre `catalog` (F02) y, más adelante, `routines`
 * (F03, rutinas del usuario) — `specs/F02-catalogo-propuesta/plan.md` §2
 * "Decisión de diseño".
 */
export interface RoutineDurationInput {
  timerDefaults: TimerSettings;
  blocks: RoutineBlock[];
}

const REPS_TO_SECONDS = 3;

export function estimateRoutineDurationSeconds(
  routine: RoutineDurationInput,
  appDefaults: TimerSettings,
): number {
  const routineDefaults = routine.timerDefaults;

  const fallback = <K extends keyof TimerSettings>(key: K): TimerSettings[K] =>
    routineDefaults[key] ?? appDefaults[key];

  let total: number = fallback("prepSeconds");

  for (const block of routine.blocks) {
    let itemsSum = 0;
    for (const item of block.items) {
      const activeSeconds = item.targetSeconds ?? (item.targetReps ?? 0) * REPS_TO_SECONDS;
      const restBetweenSets = item.timerOverrides?.restBetweenSetsSeconds ?? fallback("restBetweenSetsSeconds");
      itemsSum += item.sets * activeSeconds + Math.max(0, item.sets - 1) * restBetweenSets;
    }

    const restBetweenExercises = fallback("restBetweenExercisesSeconds");
    const gapsSum =
      block.grouping === "STRAIGHT" ? Math.max(0, block.items.length - 1) * restBetweenExercises : 0;

    const restBetweenRounds = fallback("restBetweenRoundsSeconds");
    const roundsSum = Math.max(0, block.rounds - 1) * restBetweenRounds;

    total += itemsSum + gapsSum + roundsSum;
  }

  return total;
}
