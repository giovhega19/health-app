/**
 * `DuplicateRoutine` — pruebas adicionales de cobertura (Art. 3.2) para las
 * ramas de error que `DuplicateRoutine.test.ts` (QA) no ejercita: snapshot
 * inválido (RN-06) y error del repositorio al guardar.
 */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aPredefinedRoutineSnapshot } from "@test/fakes/aPredefinedRoutineSnapshot";
import { DuplicateRoutine } from "../DuplicateRoutine";

describe("DuplicateRoutine — ramas de error", () => {
  it("propaga el error de Routine.create cuando el snapshot no tiene ejercicios (RN-06)", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new DuplicateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"));
    const snapshot = aPredefinedRoutineSnapshot({ blocks: [] });

    const result = await useCase.execute({ snapshot });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NO_ITEMS");
    }
    expect(repository.savedRoutines).toHaveLength(0);
  });

  it("propaga el error del repositorio al guardar", async () => {
    const failing: RoutineRepository = {
      findById: async () => ok(null),
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new DuplicateRoutine(failing, new FakeClock("2026-09-23T10:00:00Z"));

    const result = await useCase.execute({ snapshot: aPredefinedRoutineSnapshot() });

    expect(isErr(result)).toBe(true);
  });
});
