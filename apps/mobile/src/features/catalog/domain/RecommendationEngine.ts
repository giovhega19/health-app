import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Equipment } from "@/shared/domain/Equipment";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock, RoutineGrouping } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import type { Exercise } from "./Exercise";
import type { PredefinedRoutine } from "./PredefinedRoutine";
import type { WeeklyPlan, WeeklyPlanDay } from "./WeeklyPlan";
import type { RecommendationError } from "./errors";

/**
 * RN-14 Motor de propuesta de rutinas (`05-modelo-dominio-reglas.md` §2,
 * `specs/F02-catalogo-propuesta/plan.md` §2: "`RecommendationEngine` es una
 * función pura del dominio: `(profile, catalog) => WeeklyPlan`").
 *
 * Estrategia de ajuste de duración (RN-07: `minutesPerSession ± 10 %`): para
 * cada día se elige un número de ejercicios y un valor de series/reps/
 * descanso dentro de los rangos de RN-14 (por objetivo y nivel), y se usa
 * `TimerSettings.restBetweenRoundsSeconds` (no acotado por ninguna RN) como
 * ajuste fino para hacer que la duración estimada (RN-07) caiga exactamente
 * en el objetivo cuando es posible, y siempre dentro de la tolerancia. Ver
 * la justificación matemática completa en el plan técnico de F02 y en el
 * reporte de la tarea `F02-T04`.
 */
export interface RecommendationInput {
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: Equipment[];
  parqFlagged: boolean;
}

export interface CatalogSnapshot {
  exercises: Exercise[];
  routines: PredefinedRoutine[];
}

interface GoalTableRow {
  seriesRange: [number, number];
  repsRange: [number, number];
  restRangeBaseSeconds: [number, number];
}

const GOAL_TABLE: Record<FitnessGoal, GoalTableRow> = {
  LOSE_WEIGHT: { seriesRange: [2, 3], repsRange: [12, 15], restRangeBaseSeconds: [30, 45] },
  ENDURANCE: { seriesRange: [2, 3], repsRange: [15, 20], restRangeBaseSeconds: [20, 45] },
  MUSCLE_GAIN: { seriesRange: [3, 4], repsRange: [8, 12], restRangeBaseSeconds: [60, 90] },
  STRENGTH: { seriesRange: [3, 5], repsRange: [4, 6], restRangeBaseSeconds: [120, 180] },
  GENERAL_HEALTH: { seriesRange: [2, 3], repsRange: [10, 15], restRangeBaseSeconds: [45, 60] },
};

const BEGINNER_REST_BONUS_SECONDS = 15;
const PREP_SECONDS = 10;
const REST_BETWEEN_EXERCISES_SECONDS = 60;
const REPS_TO_SECONDS = 3;
const MAX_TRAINING_DAYS = 6;
const MAX_ITEMS_PER_DAY = 4;
const MAIN_GROUPING: RoutineGrouping = "STRAIGHT";

function seriesFor(row: GoalTableRow, level: Level): number {
  const [min, max] = row.seriesRange;
  if (level === "BEGINNER") return min;
  if (level === "ADVANCED") return max;
  return Math.round((min + max) / 2);
}

function restRangeFor(row: GoalTableRow, level: Level): [number, number] {
  const [min, max] = row.restRangeBaseSeconds;
  const bonus = level === "BEGINNER" ? BEGINNER_REST_BONUS_SECONDS : 0;
  return [min + bonus, max + bonus];
}

function itemDurationSeconds(sets: number, reps: number, restBetweenSets: number): number {
  return sets * reps * REPS_TO_SECONDS + Math.max(0, sets - 1) * restBetweenSets;
}

function daysForWeek(daysPerWeek: number): number {
  return Math.max(0, Math.min(daysPerWeek, MAX_TRAINING_DAYS));
}

function isDifficultyAllowedForLevel(difficulty: number, level: Level): boolean {
  return level === "BEGINNER" ? difficulty <= 2 : true;
}

function isMedicalAuthorizationRequired(input: RecommendationInput): boolean {
  if (!input.parqFlagged) return false;
  // RN-14: "solo se proponen rutinas BEGINNER y GENERAL_HEALTH hasta que el
  // usuario confirme autorización médica" — dos categorías permitidas
  // independientes (nivel BEGINNER, u objetivo GENERAL_HEALTH).
  return !(input.level === "BEGINNER" || input.goal === "GENERAL_HEALTH");
}

function pickCompatiblePool(exercises: Exercise[], equipment: Equipment[], level: Level): Exercise[] {
  const equipmentCompatible = exercises.filter(
    (exercise) =>
      exercise.mode === "REPS" &&
      exercise.equipment.every((item) => item === "NONE" || equipment.includes(item)),
  );

  if (level === "ADVANCED") {
    const advancedPool = equipmentCompatible.filter((exercise) => exercise.difficulty === 3);
    if (advancedPool.length > 0) return advancedPool;
  }

  const levelFiltered = equipmentCompatible.filter((exercise) =>
    isDifficultyAllowedForLevel(exercise.difficulty, level),
  );
  return levelFiltered.length > 0 ? levelFiltered : equipmentCompatible;
}

function dayBlockId(dayNumber: number): Id {
  return asId(`00000000-0000-4000-c1${String(dayNumber).padStart(2, "0")}-000000000001`);
}

function dayItemId(dayNumber: number, index: number): Id {
  return asId(`00000000-0000-4000-c2${String(dayNumber).padStart(2, "0")}-${String(index).padStart(12, "0")}`);
}

interface DayConfig {
  nItems: number;
  reps: number;
  restBetweenSets: number;
  base: number;
}

/**
 * Busca la combinación (nItems, reps, restBetweenSets) más "generosa" (más
 * ejercicios, valores intermedios del rango) cuyo costo base (sin el ajuste
 * fino de `restBetweenRoundsSeconds`) quepa dentro de `target + tolerance`.
 * El caso límite (un solo ejercicio con los valores mínimos de RN-14) está
 * garantizado matemáticamente por cumplir esa cota incluso en el escenario
 * más exigente (STRENGTH/ADVANCED, minutesPerSession=10), así que esta
 * búsqueda siempre encuentra una combinación válida.
 */
function pickDayConfig(
  targetSeconds: number,
  toleranceSeconds: number,
  sets: number,
  repsRange: [number, number],
  restRange: [number, number],
  maxItems: number,
): DayConfig {
  const upperAllowed = targetSeconds + toleranceSeconds;
  const midReps = Math.round((repsRange[0] + repsRange[1]) / 2);
  const midRest = Math.round((restRange[0] + restRange[1]) / 2);

  const candidateConfigs = [
    { reps: midReps, restBetweenSets: midRest },
    { reps: repsRange[0], restBetweenSets: restRange[0] },
  ];

  for (const candidate of candidateConfigs) {
    for (let nItems = maxItems; nItems >= 1; nItems--) {
      const perItem = itemDurationSeconds(sets, candidate.reps, candidate.restBetweenSets);
      const gaps = Math.max(0, nItems - 1) * REST_BETWEEN_EXERCISES_SECONDS;
      const base = PREP_SECONDS + nItems * perItem + gaps;
      if (base <= upperAllowed) {
        return { nItems, reps: candidate.reps, restBetweenSets: candidate.restBetweenSets, base };
      }
    }
  }

  // Red de seguridad matemáticamente innecesaria (ver comentario superior),
  // pero se conserva para que la función nunca quede sin resultado.
  const perItem = itemDurationSeconds(sets, repsRange[0], restRange[0]);
  return { nItems: 1, reps: repsRange[0], restBetweenSets: restRange[0], base: PREP_SECONDS + perItem };
}

function buildDayPlan(
  dayNumber: number,
  targetSeconds: number,
  sets: number,
  repsRange: [number, number],
  restRange: [number, number],
  pool: Exercise[],
): WeeklyPlanDay {
  const toleranceSeconds = targetSeconds * 0.1;
  const maxItems = Math.max(1, Math.min(pool.length, MAX_ITEMS_PER_DAY));

  const config = pickDayConfig(targetSeconds, toleranceSeconds, sets, repsRange, restRange, maxItems);

  const needed = targetSeconds - config.base;
  const rounds = needed > 0 ? 2 : 1;
  const restBetweenRoundsSeconds = Math.max(0, needed);

  const timerDefaults: TimerSettings = {
    prepSeconds: PREP_SECONDS,
    workSeconds: 40,
    restBetweenSetsSeconds: config.restBetweenSets,
    restBetweenExercisesSeconds: REST_BETWEEN_EXERCISES_SECONDS,
    restBetweenRoundsSeconds,
    halfwayCue: false,
  };

  const items: RoutineItem[] = Array.from({ length: config.nItems }, (_, index) => {
    const exercise = pool[index % pool.length];
    if (!exercise) {
      throw new Error("pickCompatiblePool nunca debería devolver un pool vacío en este punto.");
    }
    return {
      id: dayItemId(dayNumber, index),
      exerciseId: exercise.id,
      sets,
      targetReps: config.reps,
    };
  });

  const block: RoutineBlock = {
    id: dayBlockId(dayNumber),
    type: "MAIN",
    grouping: MAIN_GROUPING,
    rounds,
    items,
  };

  const routine = { timerDefaults, blocks: [block] };
  const estimatedDurationSeconds = estimateRoutineDurationSeconds(routine, timerDefaults);

  return { dayNumber, routine, estimatedDurationSeconds };
}

export const RecommendationEngine = {
  generate(input: RecommendationInput, catalog: CatalogSnapshot): Result<WeeklyPlan, RecommendationError> {
    if (isMedicalAuthorizationRequired(input)) {
      return err({ kind: "MEDICAL_AUTHORIZATION_REQUIRED" });
    }

    const pool = pickCompatiblePool(catalog.exercises, input.equipment, input.level);
    if (pool.length === 0) {
      return err({ kind: "NO_COMPATIBLE_EXERCISES" });
    }

    const row = GOAL_TABLE[input.goal];
    const sets = seriesFor(row, input.level);
    const restRange = restRangeFor(row, input.level);
    const targetSeconds = input.minutesPerSession * 60;
    const numDays = daysForWeek(input.daysPerWeek);

    const days: WeeklyPlanDay[] = [];
    for (let dayNumber = 1; dayNumber <= numDays; dayNumber++) {
      days.push(buildDayPlan(dayNumber, targetSeconds, sets, row.repsRange, restRange, pool));
    }

    return ok({ days });
  },
};
