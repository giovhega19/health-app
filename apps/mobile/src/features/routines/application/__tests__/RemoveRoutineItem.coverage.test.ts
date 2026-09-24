/**
 * `RemoveRoutineItem` — pruebas adicionales de cobertura (Art. 3.2: capa
 * `application` ≥ 80 %) para las ramas de error que
 * `RemoveRoutineItem.test.ts` (QA) no ejercita: rutina no encontrada, error
 * de repositorio al buscar/guardar, y fallo de `Routine.removeItem`
 * (bloque/ítem inexistente).
 */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";
import { asId } from "@/shared/domain/Id";
import { RemoveRoutineItem } from "../RemoveRoutineItem";

function buildRoutine() {
  const item = anItem();
  const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [item] };
  const created = Routine.create(aRoutine().withBlocks([block]).build());
  if (!created.ok) throw new Error("fixture inválido");
  return { routine: created.value, block, item };
}

describe("RemoveRoutineItem — ramas de error", () => {
  it("devuelve NOT_FOUND cuando la rutina no existe", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new RemoveRoutineItem(repository);

    const result = await useCase.execute({
      routineId: asId("00000000-0000-4000-9999-000000000001"),
      blockId: asId("00000000-0000-4000-9999-000000000002"),
      itemId: asId("00000000-0000-4000-9999-000000000003"),
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NOT_FOUND");
    }
  });

  it("propaga el error del repositorio al buscar la rutina", async () => {
    const failing: RoutineRepository = {
      findById: async (): Promise<Result<Routine | null, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<Routine | null, RepositoryError>,
      save: async () => ok(undefined),
      listActive: async () => ok([]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new RemoveRoutineItem(failing);

    const result = await useCase.execute({
      routineId: asId("00000000-0000-4000-9999-000000000001"),
      blockId: asId("00000000-0000-4000-9999-000000000002"),
      itemId: asId("00000000-0000-4000-9999-000000000003"),
    });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error de Routine.removeItem cuando el bloque no existe", async () => {
    const { routine } = buildRoutine();
    const repository = new FakeRoutineRepository([routine]);
    const useCase = new RemoveRoutineItem(repository);

    const result = await useCase.execute({
      routineId: routine.id,
      blockId: asId("00000000-0000-4000-9999-000000000009"),
      itemId: asId("00000000-0000-4000-9999-000000000010"),
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("BLOCK_NOT_FOUND");
    }
  });

  it("propaga el error del repositorio al guardar", async () => {
    const { routine, block, item } = buildRoutine();
    const failing: RoutineRepository = {
      findById: async () => ok(routine),
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new RemoveRoutineItem(failing);

    const result = await useCase.execute({ routineId: routine.id, blockId: block.id, itemId: item.id });

    expect(isErr(result)).toBe(true);
  });
});
