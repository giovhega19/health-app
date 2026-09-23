/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para cubrir
 * ramas/getters de `Exercise` que `Exercise.test.ts` (QA) no ejercita:
 * el rechazo por errores comunes insuficientes de forma aislada (con
 * instrucciones válidas) y los getters `met`/`imageUrl`/`isCustom`.
 * Requeridas para cumplir el umbral de cobertura de dominio (Art. 3.2: ≥ 90 %).
 */
import { Exercise } from "../Exercise";
import { asId } from "@/shared/domain/Id";

describe("Exercise — cobertura adicional", () => {
  it("rechaza crear un ejercicio con instrucciones válidas pero menos de 2 errores comunes", () => {
    expect(() =>
      Exercise.create({
        id: asId("00000000-0000-4000-8000-0000000000aa"),
        slug: "otro-invalido",
        name: "Otro ejercicio inválido",
        muscleGroups: ["CORE"],
        equipment: ["NONE"],
        difficulty: 1,
        mode: "REPS",
        met: 3,
        instructions: ["Paso 1", "Paso 2", "Paso 3"],
        commonMistakes: ["Solo un error"],
        imageUrl: "https://cdn.fitapp.test/img/otro-invalido.png",
        animationUrl: null,
        videoUrl: null,
        isCustom: false,
      }),
    ).toThrow();
  });

  it("expone met, imageUrl e isCustom", () => {
    const exercise = Exercise.create({
      id: asId("00000000-0000-4000-8000-0000000000ab"),
      slug: "ejercicio-valido",
      name: "Ejercicio válido",
      muscleGroups: ["CORE"],
      equipment: ["NONE"],
      difficulty: 1,
      mode: "REPS",
      met: 3.5,
      instructions: ["Paso 1", "Paso 2", "Paso 3"],
      commonMistakes: ["Error 1", "Error 2"],
      imageUrl: "https://cdn.fitapp.test/img/ejercicio-valido.png",
      animationUrl: null,
      videoUrl: null,
      isCustom: true,
    });

    expect(exercise.met).toBe(3.5);
    expect(exercise.imageUrl).toBe("https://cdn.fitapp.test/img/ejercicio-valido.png");
    expect(exercise.isCustom).toBe(true);
  });
});
