/**
 * RF-02.01 `GetExerciseDetail` (`features/catalog/application/GetExerciseDetail.ts`,
 * tarea `F02-T11`, todavía no implementada: esta prueba falla ahora mismo con
 * "Cannot find module '../GetExerciseDetail'", el estado rojo esperado).
 *
 * CA-02.01.1: al abrir el detalle de un ejercicio se debe poder ver su
 * animación, grupos musculares, equipo, dificultad, pasos, errores comunes y,
 * si tiene video, el dato para mostrar el botón "Ver video".
 */
import { GetExerciseDetail } from "../GetExerciseDetail";
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { EXERCISE_IDS, seedExercises } from "@test/fakes/aCatalogSnapshot";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";

describe("RF-02.01 GetExerciseDetail", () => {
  it('CA-02.01.1 devuelve el detalle completo de "Flexión de pecho": animación, grupos, equipo, dificultad, pasos, errores comunes y botón "Ver video"', async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new GetExerciseDetail(repository);

    const result = await useCase.execute(EXERCISE_IDS.pushUp);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const detail = result.value;

    expect(detail.name).toBe("Flexión de pecho");
    expect(detail.animationUrl).toBeTruthy();
    expect(detail.muscleGroups).toEqual(["CHEST"]);
    expect(detail.equipment).toEqual(["NONE"]);
    expect(detail.difficulty).toBe(1);
    expect(detail.instructions.length).toBeGreaterThanOrEqual(3);
    expect(detail.commonMistakes.length).toBeGreaterThanOrEqual(2);
    expect(detail.hasVideo()).toBe(true);
  });

  it("CA-02.01.1 un ejercicio sin video no ofrece el botón 'Ver video' (hasVideo() es false)", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new GetExerciseDetail(repository);

    const result = await useCase.execute(EXERCISE_IDS.dumbbellRow);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.hasVideo()).toBe(false);
  });

  it("CA-02.01.1 con un id que no existe en el catálogo, devuelve un error NOT_FOUND (nunca lanza)", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new GetExerciseDetail(repository);
    const unknownId = asId("99999999-9999-4999-8999-999999999999");

    const result = await useCase.execute(unknownId);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NOT_FOUND");
    }
  });
});
