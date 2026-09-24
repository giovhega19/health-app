import { isErr, ok, err } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import { Routine } from "../domain/Routine";
import type { RoutineValidationError, RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

/**
 * `ReorderRoutineItems` (CA-03.06.1 "arrastro el ejercicio 3 a la posición
 * 1", tarea `F03-T09`). Orquestación fina: carga la rutina, delega el
 * reordenamiento real en `Routine.reorderItems` (dominio) y persiste.
 */
export interface ReorderRoutineItemsInput {
  routineId: Id;
  blockId: Id;
  orderedItemIds: Id[];
}

export class ReorderRoutineItems {
  constructor(private readonly repository: RoutineRepository) {}

  async execute(
    input: ReorderRoutineItemsInput,
  ): Promise<Result<Routine, RoutineValidationError | RepositoryError>> {
    const found = await this.repository.findById(input.routineId);
    if (isErr(found)) {
      return found;
    }
    if (found.value === null) {
      return err({ kind: "NOT_FOUND" });
    }

    const reordered = found.value.reorderItems(input.blockId, input.orderedItemIds);
    if (isErr(reordered)) {
      return reordered;
    }

    const saveResult = await this.repository.save(reordered.value);
    if (isErr(saveResult)) {
      return saveResult;
    }

    return ok(reordered.value);
  }
}
