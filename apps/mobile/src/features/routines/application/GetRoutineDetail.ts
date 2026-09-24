import { err, isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Routine } from "../domain/Routine";
import type { RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

/** `GetRoutineDetail` (editor/detalle de una rutina de "Mis rutinas"). */
export class GetRoutineDetail {
  constructor(private readonly repository: RoutineRepository) {}

  async execute(id: Id): Promise<Result<Routine, RepositoryError>> {
    const found = await this.repository.findById(id);
    if (isErr(found)) {
      return found;
    }
    if (found.value === null) {
      return err({ kind: "NOT_FOUND" });
    }
    return ok(found.value);
  }
}
