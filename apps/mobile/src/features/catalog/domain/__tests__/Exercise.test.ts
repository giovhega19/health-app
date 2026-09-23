/**
 * RF-02.01 Detalle de ejercicio (`features/catalog/domain/Exercise.ts`,
 * tarea `F02-T04`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../Exercise'", el estado rojo esperado).
 *
 * `05-modelo-dominio-reglas.md` §1 (class Exercise): id, slug, name,
 * muscleGroups[], equipment[], difficulty, mode, met, instructions[],
 * commonMistakes[], mediaRefs, isCustom.
 */
import { Exercise } from "../Exercise";
import { EXERCISE_IDS, seedExercises } from "@test/fakes/aCatalogSnapshot";

describe("RF-02.01 Exercise", () => {
  it('CA-02.01.1 expone animación, grupos musculares, equipo, dificultad, pasos y errores comunes de "Flexión de pecho"', () => {
    const pushUp = seedExercises().find((exercise) => exercise.id === EXERCISE_IDS.pushUp);
    expect(pushUp).toBeDefined();

    expect(pushUp!.name).toBe("Flexión de pecho");
    expect(pushUp!.animationUrl).toBe("https://cdn.fitapp.test/anim/flexion-de-pecho.gif");
    expect(pushUp!.muscleGroups).toEqual(["CHEST"]);
    expect(pushUp!.equipment).toEqual(["NONE"]);
    expect(pushUp!.difficulty).toBe(1);
    expect(pushUp!.instructions.length).toBeGreaterThanOrEqual(3);
    expect(pushUp!.commonMistakes.length).toBeGreaterThanOrEqual(2);
  });

  it('CA-02.01.1 "Flexión de pecho" tiene video: hasVideo() es true y expone videoUrl', () => {
    const pushUp = seedExercises().find((exercise) => exercise.id === EXERCISE_IDS.pushUp)!;

    expect(pushUp.hasVideo()).toBe(true);
    expect(pushUp.videoUrl).toBe("https://cdn.fitapp.test/video/flexion-de-pecho.mp4");
  });

  it("CA-02.01.1 un ejercicio sin video (p. ej. 'Remo con mancuerna') no ofrece el botón 'Ver video'", () => {
    const dumbbellRow = seedExercises().find(
      (exercise) => exercise.id === EXERCISE_IDS.dumbbellRow,
    )!;

    expect(dumbbellRow.hasVideo()).toBe(false);
    expect(dumbbellRow.videoUrl).toBeNull();
  });

  it("CA-02.01.1 rechaza crear un ejercicio con menos de 3 instrucciones o menos de 2 errores comunes (contenido mínimo del MVP)", () => {
    expect(() =>
      Exercise.create({
        id: EXERCISE_IDS.pushUp,
        slug: "invalido",
        name: "Ejercicio inválido",
        muscleGroups: ["CHEST"],
        equipment: ["NONE"],
        difficulty: 1,
        mode: "REPS",
        met: 3,
        instructions: ["Solo un paso"],
        commonMistakes: ["Solo un error"],
        imageUrl: "https://cdn.fitapp.test/img/invalido.png",
        animationUrl: null,
        videoUrl: null,
        isCustom: false,
      }),
    ).toThrow();
  });
});
