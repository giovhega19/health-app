/**
 * RF-02.02 `FilterExercises` (`features/catalog/application/FilterExercises.ts`,
 * tarea `F02-T11`, todavía no implementada: esta prueba falla ahora mismo con
 * "Cannot find module '../FilterExercises'", el estado rojo esperado).
 *
 * CA-02.02.1: con el filtro grupo muscular = PECHO (CHEST) y equipo = NONE,
 * solo se ven ejercicios que trabajan pecho y no requieren equipo, y el
 * número de resultados se anuncia al lector de pantalla.
 *
 * Nivel elegido: aplicación (el nivel más bajo que verifica el filtrado en
 * sí y el conteo que alimentará el anuncio del lector de pantalla,
 * 07-estrategia-pruebas.md §1 "elige el nivel más bajo"). El anuncio real
 * (`AccessibilityInfo.announceForAccessibility` sobre una región viva) es un
 * detalle de la pantalla `Filters.tsx` (F02-T15, todavía sin componente que
 * probar); se cubre con RNTL cuando esa pantalla exista.
 */
import { FilterExercises } from "../FilterExercises";
import { isOk } from "@/shared/domain/Result";
import { seedExercises } from "@test/fakes/aCatalogSnapshot";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";

describe("RF-02.02 FilterExercises", () => {
  it("CA-02.02.1 grupo muscular = PECHO (CHEST) + equipo = NONE devuelve solo ejercicios de pecho sin equipo, con el conteo para el lector de pantalla", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new FilterExercises(repository);

    const result = await useCase.execute({ muscleGroup: "CHEST", equipment: "NONE" });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.items).toHaveLength(1);
    expect(result.value.items[0]?.slug).toBe("flexion-de-pecho");
    for (const exercise of result.value.items) {
      expect(exercise.muscleGroups).toContain("CHEST");
      expect(exercise.equipment).toEqual(["NONE"]);
    }
    // Conteo expuesto para el anuncio al lector de pantalla (CA-02.02.1).
    expect(result.value.count).toBe(1);
  });

  it("CA-02.02.1 un filtro sin coincidencias devuelve una lista vacía y count=0 (se anuncia '0 resultados', no un error)", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new FilterExercises(repository);

    const result = await useCase.execute({ muscleGroup: "CHEST", equipment: "PULL_UP_BAR" });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.items).toEqual([]);
    expect(result.value.count).toBe(0);
  });

  it("sin filtros, devuelve todos los ejercicios del catálogo", async () => {
    const seed = seedExercises();
    const repository = new InMemoryExerciseRepository(seed);
    const useCase = new FilterExercises(repository);

    const result = await useCase.execute({});

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.count).toBe(seed.length);
  });
});
