import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import { Routine } from "../domain/Routine";
import type { RoutineValidationError, RepositoryError } from "../domain/errors";
import type { PredefinedRoutineSnapshot, RoutineRepository } from "./ports";

/**
 * `DuplicateRoutine` (CA-03.05.1 "Duplicar y editar"): a partir de un
 * `PredefinedRoutineSnapshot` (DTO de solo lectura, sin importar `catalog`,
 * Art. 2.5), crea una copia editable con `source = USER` y el nombre
 * "<nombre> (mi versión)".
 *
 */
export interface DuplicateRoutineInput {
  snapshot: PredefinedRoutineSnapshot;
}

export class DuplicateRoutine {
  constructor(
    private readonly repository: RoutineRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: DuplicateRoutineInput,
  ): Promise<Result<Routine, RoutineValidationError | RepositoryError>> {
    const { snapshot } = input;

    const created = Routine.create({
      id: generateId(this.clock),
      name: `${snapshot.name} (mi versión)`,
      description: null,
      goal: snapshot.goal,
      level: snapshot.level,
      source: "USER",
      timerDefaults: snapshot.timerDefaults,
      blocks: snapshot.blocks,
      version: 1,
      updatedAt: this.clock.now(),
      deletedAt: null,
    });
    if (isErr(created)) {
      return created;
    }

    const saveResult = await this.repository.save(created.value);
    if (isErr(saveResult)) {
      return saveResult;
    }

    return ok(created.value);
  }
}
