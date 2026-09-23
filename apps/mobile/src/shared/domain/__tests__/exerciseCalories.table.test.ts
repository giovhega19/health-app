/**
 * RN-04 Calorías estimadas del ejercicio (`05-modelo-dominio-reglas.md` §2):
 *
 *   kcal = MET × 3,5 × pesoKg / 200 × minutosActivos
 *
 * Se suma por ejercicio usando solo el tiempo activo. Durante los descansos
 * se usa MET = 1,5. Si el perfil no tiene peso, se usan 70 kg (regla de
 * quien llama a esta función pura, no de `estimateExerciseCalories` en sí:
 * ver nota al final de este archivo).
 *
 * `shared/domain/exerciseCalories.ts` (tarea `F02-T03`) todavía no existe:
 * esta prueba falla ahora mismo con "Cannot find module", el estado rojo
 * esperado.
 */
import { estimateExerciseCalories } from "../exerciseCalories";

describe("RN-04 estimateExerciseCalories — tabla de valores de referencia", () => {
  it.each([
    // met, weightKg, activeMinutes, expectedKcal
    [8, 70, 10, 98], // dominadas (MET=8), 70kg, 10 min activos
    [3.8, 60, 5, 19.95], // flexión de pecho (MET=3.8), 60kg, 5 min
    [1.5, 70, 2, 3.675], // fase de descanso, MET=1,5 fijo por RN-04
    [11, 80, 15, 231], // salto de cuerda (MET=11), 80kg, 15 min
    [5, 70, 0, 0], // sin minutos activos → 0 kcal
    [4.5, 70, 20, 110.25], // remo con mancuerna (MET=4.5), 70kg, 20 min
  ])(
    "MET=%s, peso=%skg, %s min activos → ≈%s kcal",
    (met, weightKg, activeMinutes, expectedKcal) => {
      const kcal = estimateExerciseCalories(met, weightKg, activeMinutes);
      expect(kcal).toBeCloseTo(expectedKcal, 2);
    },
  );

  it("nunca devuelve un valor negativo cuando los minutos activos son 0", () => {
    expect(estimateExerciseCalories(8, 70, 0)).toBe(0);
  });
});

// NOTA: el valor por defecto de 70 kg "si el perfil no tiene peso" (RN-04)
// es responsabilidad de quien invoca esta función pura (p. ej. el caso de
// uso de `progress`/`workout-session` que arma los parámetros a partir del
// `UserProfile`), no de `estimateExerciseCalories`, que siempre recibe un
// `weightKg` numérico concreto. No se prueba aquí para no inventar una regla
// de "valor por defecto" dentro de una función que RN-04 describe como pura
// en términos de sus tres parámetros explícitos.
