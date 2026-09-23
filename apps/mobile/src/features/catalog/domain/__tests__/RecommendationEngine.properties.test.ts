/**
 * RN-14 (05-modelo-dominio-reglas.md §2) — invariantes generales de
 * `RecommendationEngine.generate`, verificadas con pruebas basadas en
 * propiedades (`fast-check`, 07-estrategia-pruebas.md §2.5, y
 * `specs/F02-catalogo-propuesta/plan.md` §6, riesgo "alto riesgo de casos no
 * cubiertos"). Complementa la tabla de casos de
 * `RecommendationEngine.rn14.test.ts` con propiedades que deben cumplirse
 * para *cualquier* perfil válido generado aleatoriamente, no solo los casos
 * elegidos a mano.
 *
 * Falla ahora mismo ("Cannot find module '../RecommendationEngine'") porque
 * la tarea `F02-T04` todavía no la implementa: es el estado rojo esperado.
 */
import fc from "fast-check";
import { RecommendationEngine } from "../RecommendationEngine";
import type { RecommendationInput } from "../RecommendationEngine";
import { isOk } from "@/shared/domain/Result";
import type { Equipment } from "@/shared/domain/Equipment";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import { aCatalogSnapshot } from "@test/fakes/aCatalogSnapshot";

const GOALS: FitnessGoal[] = [
  "LOSE_WEIGHT",
  "ENDURANCE",
  "MUSCLE_GAIN",
  "STRENGTH",
  "GENERAL_HEALTH",
];
const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
// Equipo presente en el catálogo semilla (@test/fakes/aCatalogSnapshot); un
// perfil real puede tener más tipos (BANDS, KETTLEBELL, ...) pero probarlos
// aquí no aportaría nada porque ningún ejercicio semilla los requiere.
const EQUIPMENT_UNIVERSE: Equipment[] = ["NONE", "DUMBBELLS", "PULL_UP_BAR", "JUMP_ROPE"];

/** Perfiles válidos según los rangos de `UserProfile` (05-modelo-dominio-reglas.md §1). */
const recommendationInputArbitrary: fc.Arbitrary<RecommendationInput> = fc.record({
  goal: fc.constantFrom(...GOALS),
  level: fc.constantFrom(...LEVELS),
  daysPerWeek: fc.integer({ min: 1, max: 7 }),
  minutesPerSession: fc.integer({ min: 10, max: 120 }),
  equipment: fc.subarray(EQUIPMENT_UNIVERSE),
  // parqFlagged se cubre con casos concretos (RecommendationEngine.rn14.test.ts);
  // aquí se fija en `false` para no mezclar dos reglas distintas en la misma
  // propiedad ("bloqueo por aptitud" vs. "límites numéricos/estructurales").
  parqFlagged: fc.constant(false),
});

describe("RN-14 RecommendationEngine.generate — invariantes (property-based)", () => {
  const catalog = aCatalogSnapshot();

  it("nunca programa más de 6 días de entrenamiento, para cualquier perfil válido", () => {
    fc.assert(
      fc.property(recommendationInputArbitrary, (input) => {
        const result = RecommendationEngine.generate(input, catalog);
        if (!isOk(result)) return;
        expect(result.value.days.length).toBeLessThanOrEqual(6);
      }),
      { numRuns: 100 },
    );
  });

  it("el número de días programados nunca es negativo", () => {
    fc.assert(
      fc.property(recommendationInputArbitrary, (input) => {
        const result = RecommendationEngine.generate(input, catalog);
        if (!isOk(result)) return;
        expect(result.value.days.length).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it("RN-07: la duración estimada de cada día siempre cae dentro de minutesPerSession ± 10 %", () => {
    fc.assert(
      fc.property(recommendationInputArbitrary, (input) => {
        const result = RecommendationEngine.generate(input, catalog);
        if (!isOk(result)) return;

        const targetSeconds = input.minutesPerSession * 60;
        const toleranceSeconds = targetSeconds * 0.1;

        for (const day of result.value.days) {
          expect(day.estimatedDurationSeconds).toBeGreaterThanOrEqual(
            targetSeconds - toleranceSeconds,
          );
          expect(day.estimatedDurationSeconds).toBeLessThanOrEqual(
            targetSeconds + toleranceSeconds,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  it("solo elige ejercicios compatibles con el equipo disponible del perfil (o que no requieren equipo, NONE)", () => {
    fc.assert(
      fc.property(recommendationInputArbitrary, (input) => {
        const result = RecommendationEngine.generate(input, catalog);
        if (!isOk(result)) return;

        for (const day of result.value.days) {
          for (const block of day.routine.blocks) {
            for (const item of block.items) {
              const exercise = catalog.exercises.find(
                (candidate) => candidate.id === item.exerciseId,
              );
              expect(exercise).toBeDefined();
              for (const equipment of exercise!.equipment) {
                expect(equipment === "NONE" || input.equipment.includes(equipment)).toBe(true);
              }
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
