/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para cubrir las
 * ramas de propagación de errores de `ExerciseRepository` en
 * `FilterExercises`, `GenerateProposal` y `GetExerciseDetail` (los fakes de
 * QA, `InMemoryExerciseRepository`, siempre devuelven `ok(...)`; aquí se usa
 * un repositorio local que siempre falla). Requeridas para cumplir el
 * umbral de cobertura de aplicación (Art. 3.2: ≥ 80 %).
 */
import { err, isErr } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Exercise } from "../../domain/Exercise";
import type { ExerciseFilter, ExerciseRepository, RepositoryError } from "../ports";
import { FilterExercises } from "../FilterExercises";
import { GetExerciseDetail } from "../GetExerciseDetail";
import { GenerateProposal } from "../GenerateProposal";
import { aProfileSnapshot } from "@test/fakes/aProfileSnapshot";

class AlwaysFailingExerciseRepository implements ExerciseRepository {
  private readonly error: RepositoryError = { kind: "STORAGE_ERROR", message: "boom" };

  async findById(_id: Id): Promise<Result<Exercise | null, RepositoryError>> {
    return err(this.error);
  }

  async filter(_criteria: ExerciseFilter): Promise<Result<Exercise[], RepositoryError>> {
    return err(this.error);
  }

  async upsertMany(_exercises: Exercise[]): Promise<Result<void, RepositoryError>> {
    return err(this.error);
  }
}

describe("Propagación de errores de ExerciseRepository", () => {
  it("FilterExercises propaga el error del repositorio", async () => {
    const useCase = new FilterExercises(new AlwaysFailingExerciseRepository());

    const result = await useCase.execute({});

    expect(isErr(result)).toBe(true);
  });

  it("GetExerciseDetail propaga el error del repositorio (distinto de NOT_FOUND)", async () => {
    const useCase = new GetExerciseDetail(new AlwaysFailingExerciseRepository());

    const result = await useCase.execute("00000000-0000-4000-8000-000000000001" as Id);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).not.toBe("NOT_FOUND");
    }
  });

  it("GenerateProposal devuelve un error controlado cuando el repositorio falla", async () => {
    const useCase = new GenerateProposal(new AlwaysFailingExerciseRepository());

    const result = await useCase.execute(aProfileSnapshot());

    expect(isErr(result)).toBe(true);
  });
});
