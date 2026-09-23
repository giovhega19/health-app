/**
 * RF-02.04 `GenerateProposal` (`features/catalog/application/GenerateProposal.ts`,
 * tarea `F02-T10` — implementa la forma de `RoutineProposalPort` de F01 y se
 * expone en `features/catalog/index.ts`; todavía no implementada: esta
 * prueba falla ahora mismo con "Cannot find module '../GenerateProposal'",
 * el estado rojo esperado).
 *
 * Complementa `RecommendationEngine.rn14.test.ts` (CA-02.04.1) verificando el
 * límite de la aplicación: `GenerateProposal` recibe un `ProfileSnapshot` de
 * solo lectura (plan.md §1: "sin importar nada de `features/profile`"), lo
 * traduce a `RecommendationInput`, carga el catálogo a través de
 * `ExerciseRepository` y delega en `RecommendationEngine.generate` (RN-14).
 */
import { GenerateProposal } from "../GenerateProposal";
import { isErr, isOk } from "@/shared/domain/Result";
import { seedExercises } from "@test/fakes/aCatalogSnapshot";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";
import { aProfileSnapshot } from "@test/fakes/aProfileSnapshot";

describe("RF-02.04 GenerateProposal", () => {
  it("CA-02.04.1 con el ProfileSnapshot de un perfil MUSCLE_GAIN/INTERMEDIATE/4 días/60 min, genera un plan de 4 días", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new GenerateProposal(repository);

    const result = await useCase.execute(aProfileSnapshot());

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.days).toHaveLength(4);
  });

  it("CA-02.04.2 con 7 días por semana en el ProfileSnapshot, programa como máximo 6 días", async () => {
    const repository = new InMemoryExerciseRepository(seedExercises());
    const useCase = new GenerateProposal(repository);

    const result = await useCase.execute(aProfileSnapshot({ daysPerWeek: 7 }));

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.days.length).toBeLessThanOrEqual(6);
  });

  it("con un catálogo local vacío (sin sincronizar todavía), devuelve un error de propuesta en vez de lanzar", async () => {
    const repository = new InMemoryExerciseRepository([]);
    const useCase = new GenerateProposal(repository);

    const result = await useCase.execute(aProfileSnapshot());

    expect(isErr(result)).toBe(true);
  });
});
