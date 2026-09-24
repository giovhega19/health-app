import { isErr, ok, err } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import { Routine } from "../domain/Routine";
import type { RoutineValidationError, RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

/**
 * `RemoveRoutineItem` (CA-03.06.1 "al eliminar un ejercicio aparece
 * 'Deshacer' durante 5 s", tarea `F03-T09`). La ventana de 5 s es
 * responsabilidad de la UI (`presentation/stores/useRoutineEditorStore.ts`);
 * este caso de uso solo quita el ítem (delegado en `Routine.removeItem`) y
 * devuelve el ítem eliminado para que la UI pueda re-insertarlo si el
 * usuario deshace.
 */
export interface RemoveRoutineItemInput {
  routineId: Id;
  blockId: Id;
  itemId: Id;
}

export interface RemoveRoutineItemOutput {
  routine: Routine;
  removedItem: RoutineItem | undefined;
}

export class RemoveRoutineItem {
  constructor(private readonly repository: RoutineRepository) {}

  async execute(
    input: RemoveRoutineItemInput,
  ): Promise<Result<RemoveRoutineItemOutput, RoutineValidationError | RepositoryError>> {
    const found = await this.repository.findById(input.routineId);
    if (isErr(found)) {
      return found;
    }
    if (found.value === null) {
      return err({ kind: "NOT_FOUND" });
    }

    const block = found.value.blocks.find((candidate) => candidate.id === input.blockId);
    const removedItem = block?.items.find((item) => item.id === input.itemId);

    const removed = found.value.removeItem(input.blockId, input.itemId);
    if (isErr(removed)) {
      return removed;
    }

    const saveResult = await this.repository.save(removed.value);
    if (isErr(saveResult)) {
      return saveResult;
    }

    return ok({ routine: removed.value, removedItem });
  }
}
