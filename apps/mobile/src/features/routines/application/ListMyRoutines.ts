import type { Result } from "@/shared/domain/Result";
import type { Routine } from "../domain/Routine";
import type { RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

/** `ListMyRoutines` (RF-03.01…RF-03.06, pantalla "Mis rutinas"). */
export class ListMyRoutines {
  constructor(private readonly repository: RoutineRepository) {}

  async execute(): Promise<Result<Routine[], RepositoryError>> {
    return this.repository.listActive();
  }
}
