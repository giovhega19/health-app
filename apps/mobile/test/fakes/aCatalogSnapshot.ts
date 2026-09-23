/**
 * Catálogo semilla de prueba (fixture) para F02 · Catálogo, rutinas
 * predefinidas y propuesta.
 *
 * Referencia: `specs/F02-catalogo-propuesta/plan.md` §1 "Contenido de datos"
 * (6–8 ejercicios variados, al menos uno por grupo muscular principal,
 * mezclando `mode: REPS`/`mode: TIME`, al menos dos sin equipo y dos con
 * equipo; 2–3 rutinas predefinidas cubriendo al menos dos objetivos, una
 * BEGINNER sin equipo) y `plan.md` §5 (`test/fakes/aCatalogSnapshot.ts`).
 *
 * IMPORTANTE (fase roja de TDD): este fixture construye instancias reales de
 * `Exercise`/`PredefinedRoutine` (features/catalog/domain), que todavía no
 * existen (tarea `F02-T04`), y usa los tipos `Equipment`/`FitnessGoal`/`Level`
 * de `shared/domain` que crea `F01-T02` y `MuscleGroup`/`ExerciseDifficulty`/
 * `ExerciseMode` que crea `F02-T03`. Hasta que esas tareas se implementen,
 * importar este archivo falla ("Cannot find module"): es el estado rojo
 * esperado, no un error de este fixture.
 *
 * NO es el contenido real del catálogo (~60 ejercicios validados por un
 * profesional del deporte, fuera de alcance técnico, ver `spec.md` "Contenido
 * mínimo del MVP"). Es una lista pequeña y representativa para pruebas
 * automatizadas y para `CatalogDevSeeder`/`infrastructure/seed/dev-catalog.json`
 * (F02-T07/F02-T09), que deben usar la MISMA lista para evitar drift (riesgo
 * documentado en `plan.md` §6).
 */
import { asId } from "@/shared/domain/Id";
import { Exercise } from "@/features/catalog/domain/Exercise";
import { PredefinedRoutine } from "@/features/catalog/domain/PredefinedRoutine";
import type { CatalogSnapshot } from "@/features/catalog/domain/RecommendationEngine";

// UUIDs fijos y legibles (solo para pruebas) para poder referenciarlos desde
// los distintos archivos de prueba sin recalcularlos.
export const EXERCISE_IDS = {
  pushUp: asId("00000000-0000-4000-8000-000000000001"),
  dumbbellRow: asId("00000000-0000-4000-8000-000000000002"),
  pullUp: asId("00000000-0000-4000-8000-000000000003"),
  dumbbellSquat: asId("00000000-0000-4000-8000-000000000004"),
  lunge: asId("00000000-0000-4000-8000-000000000005"),
  dumbbellShoulderPress: asId("00000000-0000-4000-8000-000000000006"),
  plank: asId("00000000-0000-4000-8000-000000000007"),
  jumpRope: asId("00000000-0000-4000-8000-000000000008"),
} as const;

export const ROUTINE_IDS = {
  fullBodyNoEquipmentBeginner: asId("00000000-0000-4000-9000-000000000001"),
  upperLowerDumbbells: asId("00000000-0000-4000-9000-000000000002"),
  cardioEndurance: asId("00000000-0000-4000-9000-000000000003"),
} as const;

/**
 * "Flexión de pecho": el ejemplo literal usado por CA-02.01.1 en `spec.md`
 * ("Cuando abro el ejercicio 'Flexión de pecho'"). Es el único de la semilla
 * con `videoUrl` (placeholder), para poder probar el botón "Ver video".
 */
function pushUp(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.pushUp,
    slug: "flexion-de-pecho",
    name: "Flexión de pecho",
    muscleGroups: ["CHEST"],
    equipment: ["NONE"],
    difficulty: 1,
    mode: "REPS",
    met: 3.8,
    instructions: [
      "Apoya las manos al ancho de los hombros y estira las piernas.",
      "Baja el pecho hacia el suelo manteniendo el cuerpo recto.",
      "Empuja hasta extender los brazos sin bloquear los codos.",
    ],
    commonMistakes: ["Dejar caer la cadera.", "No completar el rango de movimiento."],
    imageUrl: "https://cdn.fitapp.test/img/flexion-de-pecho.png",
    animationUrl: "https://cdn.fitapp.test/anim/flexion-de-pecho.gif",
    videoUrl: "https://cdn.fitapp.test/video/flexion-de-pecho.mp4",
    isCustom: false,
  });
}

function dumbbellRow(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.dumbbellRow,
    slug: "remo-con-mancuerna",
    name: "Remo con mancuerna",
    muscleGroups: ["BACK"],
    equipment: ["DUMBBELLS"],
    difficulty: 2,
    mode: "REPS",
    met: 4.5,
    instructions: [
      "Apoya una rodilla y una mano en un banco, espalda recta.",
      "Sube la mancuerna hasta la cadera llevando el codo hacia atrás.",
      "Baja de forma controlada hasta extender el brazo.",
    ],
    commonMistakes: ["Rotar el tronco.", "Usar impulso en vez de controlar el movimiento."],
    imageUrl: "https://cdn.fitapp.test/img/remo-con-mancuerna.png",
    animationUrl: "https://cdn.fitapp.test/anim/remo-con-mancuerna.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function pullUp(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.pullUp,
    slug: "dominadas",
    name: "Dominadas",
    muscleGroups: ["BACK"],
    equipment: ["PULL_UP_BAR"],
    difficulty: 3,
    mode: "REPS",
    met: 8,
    instructions: [
      "Cuelga de la barra con agarre prono al ancho de los hombros.",
      "Tira hasta que la barbilla supere la barra.",
      "Baja de forma controlada hasta extender los brazos.",
    ],
    commonMistakes: [
      "Impulsarse con las piernas (kipping).",
      "No bajar hasta la extensión completa.",
    ],
    imageUrl: "https://cdn.fitapp.test/img/dominadas.png",
    animationUrl: "https://cdn.fitapp.test/anim/dominadas.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function dumbbellSquat(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.dumbbellSquat,
    slug: "sentadilla-con-mancuernas",
    name: "Sentadilla con mancuernas",
    muscleGroups: ["LEGS"],
    equipment: ["DUMBBELLS"],
    difficulty: 2,
    mode: "REPS",
    met: 5,
    instructions: [
      "Sostén una mancuerna en cada mano a los lados del cuerpo.",
      "Flexiona cadera y rodillas bajando el glúteo hacia atrás.",
      "Empuja con los talones hasta extender las piernas.",
    ],
    commonMistakes: [
      "Dejar que las rodillas colapsen hacia adentro.",
      "Redondear la espalda baja.",
    ],
    imageUrl: "https://cdn.fitapp.test/img/sentadilla-con-mancuernas.png",
    animationUrl: "https://cdn.fitapp.test/anim/sentadilla-con-mancuernas.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function lunge(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.lunge,
    slug: "zancadas",
    name: "Zancadas",
    muscleGroups: ["LEGS"],
    equipment: ["NONE"],
    difficulty: 1,
    mode: "REPS",
    met: 4,
    instructions: [
      "Da un paso largo hacia adelante.",
      "Baja la cadera hasta que ambas rodillas formen ~90°.",
      "Empuja con la pierna delantera para volver a la posición inicial.",
    ],
    commonMistakes: [
      "Adelantar demasiado la rodilla sobre la punta del pie.",
      "Dar un paso demasiado corto.",
    ],
    imageUrl: "https://cdn.fitapp.test/img/zancadas.png",
    animationUrl: "https://cdn.fitapp.test/anim/zancadas.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function dumbbellShoulderPress(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.dumbbellShoulderPress,
    slug: "press-hombro-mancuerna",
    name: "Press de hombro con mancuerna",
    muscleGroups: ["SHOULDERS"],
    equipment: ["DUMBBELLS"],
    difficulty: 2,
    mode: "REPS",
    met: 4.2,
    instructions: [
      "Sostén una mancuerna en cada mano a la altura de los hombros.",
      "Empuja hacia arriba hasta extender los brazos.",
      "Baja de forma controlada hasta la posición inicial.",
    ],
    commonMistakes: [
      "Arquear excesivamente la espalda baja.",
      "No extender completamente los brazos.",
    ],
    imageUrl: "https://cdn.fitapp.test/img/press-hombro-mancuerna.png",
    animationUrl: "https://cdn.fitapp.test/anim/press-hombro-mancuerna.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function plank(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.plank,
    slug: "plancha",
    name: "Plancha",
    muscleGroups: ["CORE"],
    equipment: ["NONE"],
    difficulty: 1,
    mode: "TIME",
    met: 3,
    instructions: [
      "Apoya antebrazos y puntas de los pies en el suelo.",
      "Mantén el cuerpo alineado de cabeza a talones.",
      "Contrae el abdomen y sostén la posición.",
    ],
    commonMistakes: ["Dejar caer la cadera.", "Elevar demasiado la cadera."],
    imageUrl: "https://cdn.fitapp.test/img/plancha.png",
    animationUrl: "https://cdn.fitapp.test/anim/plancha.gif",
    videoUrl: null,
    isCustom: false,
  });
}

function jumpRope(): Exercise {
  return Exercise.create({
    id: EXERCISE_IDS.jumpRope,
    slug: "salto-de-cuerda",
    name: "Salto de cuerda",
    muscleGroups: ["CARDIO"],
    equipment: ["JUMP_ROPE"],
    difficulty: 2,
    mode: "TIME",
    met: 11,
    instructions: [
      "Sostén una cuerda con un mango en cada mano.",
      "Salta con ambos pies a la vez que la cuerda pasa bajo ellos.",
      "Mantén un ritmo constante y los codos cerca del cuerpo.",
    ],
    commonMistakes: ["Saltar demasiado alto.", "Mirar hacia los pies en vez de al frente."],
    imageUrl: "https://cdn.fitapp.test/img/salto-de-cuerda.png",
    animationUrl: "https://cdn.fitapp.test/anim/salto-de-cuerda.gif",
    videoUrl: null,
    isCustom: false,
  });
}

/** Los 8 ejercicios semilla, en el mismo orden que `EXERCISE_IDS`. */
export function seedExercises(): Exercise[] {
  return [
    pushUp(),
    dumbbellRow(),
    pullUp(),
    dumbbellSquat(),
    lunge(),
    dumbbellShoulderPress(),
    plank(),
    jumpRope(),
  ];
}

const DEFAULT_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

function fullBodyNoEquipmentBeginner(): PredefinedRoutine {
  return PredefinedRoutine.create({
    id: ROUTINE_IDS.fullBodyNoEquipmentBeginner,
    name: "Cuerpo completo sin equipo",
    goal: "LOSE_WEIGHT",
    level: "BEGINNER",
    timerDefaults: { ...DEFAULT_TIMER_DEFAULTS, restBetweenSetsSeconds: 45 },
    blocks: [
      {
        id: asId("00000000-0000-4000-a000-000000000001"),
        type: "MAIN",
        grouping: "CIRCUIT",
        rounds: 3,
        items: [
          {
            id: asId("00000000-0000-4000-a000-000000000002"),
            exerciseId: EXERCISE_IDS.pushUp,
            sets: 1,
            targetReps: 12,
          },
          {
            id: asId("00000000-0000-4000-a000-000000000003"),
            exerciseId: EXERCISE_IDS.lunge,
            sets: 1,
            targetReps: 12,
          },
          {
            id: asId("00000000-0000-4000-a000-000000000004"),
            exerciseId: EXERCISE_IDS.plank,
            sets: 1,
            targetSeconds: 30,
          },
        ],
      },
    ],
    version: 1,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

function upperLowerDumbbells(): PredefinedRoutine {
  return PredefinedRoutine.create({
    id: ROUTINE_IDS.upperLowerDumbbells,
    name: "Torso-pierna con mancuernas",
    goal: "MUSCLE_GAIN",
    level: "INTERMEDIATE",
    timerDefaults: DEFAULT_TIMER_DEFAULTS,
    blocks: [
      {
        id: asId("00000000-0000-4000-a000-000000000005"),
        type: "MAIN",
        grouping: "STRAIGHT",
        rounds: 1,
        items: [
          {
            id: asId("00000000-0000-4000-a000-000000000006"),
            exerciseId: EXERCISE_IDS.dumbbellRow,
            sets: 4,
            targetReps: 10,
          },
          {
            id: asId("00000000-0000-4000-a000-000000000007"),
            exerciseId: EXERCISE_IDS.pullUp,
            sets: 3,
            targetReps: 8,
          },
          {
            id: asId("00000000-0000-4000-a000-000000000008"),
            exerciseId: EXERCISE_IDS.dumbbellSquat,
            sets: 4,
            targetReps: 10,
          },
        ],
      },
    ],
    version: 1,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

function cardioEndurance(): PredefinedRoutine {
  return PredefinedRoutine.create({
    id: ROUTINE_IDS.cardioEndurance,
    name: "Resistencia cardio",
    goal: "ENDURANCE",
    level: "ADVANCED",
    timerDefaults: DEFAULT_TIMER_DEFAULTS,
    blocks: [
      {
        id: asId("00000000-0000-4000-a000-000000000009"),
        type: "MAIN",
        grouping: "CIRCUIT",
        rounds: 4,
        items: [
          {
            id: asId("00000000-0000-4000-a000-00000000000a"),
            exerciseId: EXERCISE_IDS.jumpRope,
            sets: 1,
            targetSeconds: 45,
          },
          {
            id: asId("00000000-0000-4000-a000-00000000000b"),
            exerciseId: EXERCISE_IDS.plank,
            sets: 1,
            targetSeconds: 30,
          },
        ],
      },
    ],
    version: 1,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

/** Las 3 rutinas predefinidas semilla, cubriendo LOSE_WEIGHT/MUSCLE_GAIN/ENDURANCE. */
export function seedRoutines(): PredefinedRoutine[] {
  return [fullBodyNoEquipmentBeginner(), upperLowerDumbbells(), cardioEndurance()];
}

/** Catálogo completo (ejercicios + rutinas) tal como lo consume `RecommendationEngine`. */
export function aCatalogSnapshot(): CatalogSnapshot {
  return { exercises: seedExercises(), routines: seedRoutines() };
}
