/**
 * RN-14 Motor de propuesta de rutinas (`05-modelo-dominio-reglas.md` §2) y
 * RF-02.04 (`features/catalog/domain/RecommendationEngine.ts`, tarea
 * `F02-T04`, todavía no implementada: esta prueba falla ahora mismo con
 * "Cannot find module '../RecommendationEngine'", el estado rojo esperado).
 *
 * Cubre explícitamente:
 *   - CA-02.04.1 (perfil MUSCLE_GAIN/INTERMEDIATE/4 días/60 min/equipo
 *     [DUMBBELLS, PULL_UP_BAR] → plan torso-pierna de 4 días).
 *   - CA-02.04.2 (7 días disponibles → máximo 6 días programados).
 *   - Tabla de casos objetivo × nivel × días de RN-14 (series/reps/descanso).
 *
 * `RecommendationEngine.generate` se asume una función pura estática (plan.md
 * §2: "`RecommendationEngine` es una función pura del dominio:
 * `(profile, catalog) => WeeklyPlan`"), expuesta como
 * `RecommendationEngine.generate(input, catalog): Result<WeeklyPlan, RecommendationError>`.
 */
import { RecommendationEngine } from "../RecommendationEngine";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import { isErr, isOk } from "@/shared/domain/Result";
import { aCatalogSnapshot } from "@test/fakes/aCatalogSnapshot";
import { aRecommendationInput } from "@test/fakes/aRecommendationInput";

const ALL_EQUIPMENT = ["NONE", "DUMBBELLS", "PULL_UP_BAR", "JUMP_ROPE"] as const;

describe("RF-02.04 / RN-14 RecommendationEngine.generate", () => {
  const catalog = aCatalogSnapshot();

  describe("CA-02.04.1 propuesta según perfil (MUSCLE_GAIN/INTERMEDIATE/4 días/60 min)", () => {
    it("genera un plan de 4 días con series 3-4, reps 8-12, descanso 60-90 s, duración 54-66 min y solo equipo [NONE, DUMBBELLS, PULL_UP_BAR]", () => {
      const input = aRecommendationInput();

      const result = RecommendationEngine.generate(input, catalog);

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;
      const plan = result.value;

      expect(plan.days).toHaveLength(4);

      for (const day of plan.days) {
        // RN-07: duración ajustada a minutesPerSession ± 10 % (60 min → 54-66 min).
        expect(day.estimatedDurationSeconds).toBeGreaterThanOrEqual(54 * 60);
        expect(day.estimatedDurationSeconds).toBeLessThanOrEqual(66 * 60);

        for (const block of day.routine.blocks) {
          for (const item of block.items) {
            expect(item.sets).toBeGreaterThanOrEqual(3);
            expect(item.sets).toBeLessThanOrEqual(4);
            if (item.targetReps != null) {
              expect(item.targetReps).toBeGreaterThanOrEqual(8);
              expect(item.targetReps).toBeLessThanOrEqual(12);
            }

            const rest =
              item.timerOverrides?.restBetweenSetsSeconds ??
              day.routine.timerDefaults.restBetweenSetsSeconds;
            expect(rest).toBeGreaterThanOrEqual(60);
            expect(rest).toBeLessThanOrEqual(90);

            const exercise = catalog.exercises.find(
              (candidate) => candidate.id === item.exerciseId,
            );
            expect(exercise).toBeDefined();
            for (const equipment of exercise!.equipment) {
              expect(["NONE", "DUMBBELLS", "PULL_UP_BAR"]).toContain(equipment);
            }
          }
        }
      }
    });
  });

  describe("CA-02.04.2 siempre al menos un día de descanso", () => {
    it("con 7 días disponibles, la propuesta programa como máximo 6 días de entrenamiento", () => {
      const input = aRecommendationInput({ daysPerWeek: 7 });

      const result = RecommendationEngine.generate(input, catalog);

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;
      expect(result.value.days.length).toBeLessThanOrEqual(6);
    });
  });

  describe("RN-14 catálogo sin ejercicios: error de dominio, nunca una excepción", () => {
    it("devuelve Result err en vez de lanzar cuando el catálogo no tiene ejercicios", () => {
      const input = aRecommendationInput();

      const result = RecommendationEngine.generate(input, { exercises: [], routines: [] });

      expect(isErr(result)).toBe(true);
    });
  });

  describe("RN-14 cuestionario de aptitud positivo (parqFlagged)", () => {
    it("con parqFlagged=true y un objetivo/nivel fuera de BEGINNER/GENERAL_HEALTH, devuelve un error hasta que el usuario confirme autorización médica", () => {
      const input = aRecommendationInput({
        parqFlagged: true,
        goal: "STRENGTH",
        level: "ADVANCED",
      });

      const result = RecommendationEngine.generate(input, catalog);

      expect(isErr(result)).toBe(true);
    });

    it("con parqFlagged=true y GENERAL_HEALTH/BEGINNER, genera la propuesta normalmente", () => {
      const input = aRecommendationInput({
        parqFlagged: true,
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        equipment: [...ALL_EQUIPMENT],
      });

      const result = RecommendationEngine.generate(input, catalog);

      expect(isOk(result)).toBe(true);
    });
  });

  // --- Tabla de casos RN-14: objetivo × nivel × días -----------------------
  //
  // Parámetros base por objetivo (05-modelo-dominio-reglas.md RN-14).
  // Ajuste por nivel: BEGINNER → límite inferior de series + 15 s de
  // descanso; ADVANCED → límite superior de series; INTERMEDIATE → sin
  // ajuste (cualquier valor dentro del rango base).
  const RN14_GOAL_TABLE: {
    goal: FitnessGoal;
    seriesRange: [number, number];
    repsRange: [number, number];
    restRangeBaseSeconds: [number, number];
  }[] = [
    {
      goal: "LOSE_WEIGHT",
      seriesRange: [2, 3],
      repsRange: [12, 15],
      restRangeBaseSeconds: [30, 45],
    },
    { goal: "ENDURANCE", seriesRange: [2, 3], repsRange: [15, 20], restRangeBaseSeconds: [20, 45] },
    {
      goal: "MUSCLE_GAIN",
      seriesRange: [3, 4],
      repsRange: [8, 12],
      restRangeBaseSeconds: [60, 90],
    },
    { goal: "STRENGTH", seriesRange: [3, 5], repsRange: [4, 6], restRangeBaseSeconds: [120, 180] },
    {
      goal: "GENERAL_HEALTH",
      seriesRange: [2, 3],
      repsRange: [10, 15],
      restRangeBaseSeconds: [45, 60],
    },
  ];

  const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  // Un valor representativo por cada bucket de división de RN-14
  // (1-3 cuerpo completo, 4 torso/pierna, 5-6 empuje/tirón/pierna, 7 forzado a <=6).
  const DAYS_PER_WEEK_BUCKETS = [3, 4, 6, 7];

  function expectedSeriesRange(
    row: (typeof RN14_GOAL_TABLE)[number],
    level: Level,
  ): [number, number] {
    const [min, max] = row.seriesRange;
    if (level === "BEGINNER") return [min, min];
    if (level === "ADVANCED") return [max, max];
    return [min, max];
  }

  function expectedRestRangeSeconds(
    row: (typeof RN14_GOAL_TABLE)[number],
    level: Level,
  ): [number, number] {
    const [min, max] = row.restRangeBaseSeconds;
    const beginnerBonus = level === "BEGINNER" ? 15 : 0;
    return [min + beginnerBonus, max + beginnerBonus];
  }

  type Rn14Case = {
    goal: FitnessGoal;
    level: Level;
    daysPerWeek: number;
    seriesRange: [number, number];
    repsRange: [number, number];
    restRangeSeconds: [number, number];
  };

  function generateRn14Cases(): Rn14Case[] {
    const cases: Rn14Case[] = [];
    for (const row of RN14_GOAL_TABLE) {
      for (const level of LEVELS) {
        for (const daysPerWeek of DAYS_PER_WEEK_BUCKETS) {
          cases.push({
            goal: row.goal,
            level,
            daysPerWeek,
            seriesRange: expectedSeriesRange(row, level),
            repsRange: row.repsRange,
            restRangeSeconds: expectedRestRangeSeconds(row, level),
          });
        }
      }
    }
    return cases;
  }

  describe.each(generateRn14Cases())(
    "RN-14 tabla: $goal / $level / $daysPerWeek días por semana",
    ({ goal, level, daysPerWeek, seriesRange, repsRange, restRangeSeconds }) => {
      it(`series ${seriesRange[0]}-${seriesRange[1]}, reps ${repsRange[0]}-${repsRange[1]}, descanso ${restRangeSeconds[0]}-${restRangeSeconds[1]} s, máximo 6 días programados`, () => {
        const input = aRecommendationInput({
          goal,
          level,
          daysPerWeek,
          minutesPerSession: 45,
          equipment: [...ALL_EQUIPMENT],
        });

        const result = RecommendationEngine.generate(input, catalog);

        expect(isOk(result)).toBe(true);
        if (!isOk(result)) return;
        const plan = result.value;

        expect(plan.days.length).toBeLessThanOrEqual(6);
        if (daysPerWeek <= 6) {
          expect(plan.days.length).toBe(daysPerWeek);
        }

        for (const day of plan.days) {
          for (const block of day.routine.blocks) {
            for (const item of block.items) {
              expect(item.sets).toBeGreaterThanOrEqual(seriesRange[0]);
              expect(item.sets).toBeLessThanOrEqual(seriesRange[1]);

              if (item.targetReps != null) {
                expect(item.targetReps).toBeGreaterThanOrEqual(repsRange[0]);
                expect(item.targetReps).toBeLessThanOrEqual(repsRange[1]);
              }

              const rest =
                item.timerOverrides?.restBetweenSetsSeconds ??
                day.routine.timerDefaults.restBetweenSetsSeconds;
              expect(rest).toBeGreaterThanOrEqual(restRangeSeconds[0]);
              expect(rest).toBeLessThanOrEqual(restRangeSeconds[1]);
            }
          }
        }
      });
    },
  );
});
