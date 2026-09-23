/**
 * RN-04 Calorías estimadas del ejercicio — invariantes generales con
 * pruebas basadas en propiedades (07-estrategia-pruebas.md §2.5).
 *
 * `shared/domain/exerciseCalories.ts` (tarea `F02-T03`) todavía no existe:
 * esta prueba falla ahora mismo con "Cannot find module", el estado rojo
 * esperado.
 */
import fc from "fast-check";
import { estimateExerciseCalories } from "../exerciseCalories";

describe("RN-04 estimateExerciseCalories — propiedades", () => {
  it("nunca es negativa para MET, peso y minutos no negativos", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 20, noNaN: true }), // MET típico 1-20
        fc.float({ min: 0, max: 500, noNaN: true }), // peso (RN-06: 0-500 kg)
        fc.float({ min: 0, max: 600, noNaN: true }), // minutos activos
        (met, weightKg, activeMinutes) => {
          expect(estimateExerciseCalories(met, weightKg, activeMinutes)).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("crece monótonamente con los minutos activos, a igualdad de MET y peso", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: 20, noNaN: true }),
        fc.float({ min: 1, max: 500, noNaN: true }),
        fc.float({ min: 0, max: 590, noNaN: true }),
        (met, weightKg, activeMinutes) => {
          const shorter = estimateExerciseCalories(met, weightKg, activeMinutes);
          const longer = estimateExerciseCalories(met, weightKg, activeMinutes + 10);
          expect(longer).toBeGreaterThanOrEqual(shorter);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("es proporcional al MET: duplicar el MET duplica las calorías estimadas", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: 10, noNaN: true }),
        fc.float({ min: 1, max: 500, noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: 600, noNaN: true }),
        (met, weightKg, activeMinutes) => {
          const base = estimateExerciseCalories(met, weightKg, activeMinutes);
          const doubled = estimateExerciseCalories(met * 2, weightKg, activeMinutes);
          expect(doubled).toBeCloseTo(base * 2, 5);
        },
      ),
      { numRuns: 200 },
    );
  });
});
