import type { Result } from "@/shared/domain/Result";
import type { PredefinedRoutine } from "../domain/PredefinedRoutine";
import type { PredefinedRoutineRepository, RepositoryError } from "./ports";

/**
 * `ListPredefinedRoutines` (CA-03.05.1 "Predefinidas protegidas", cierre de
 * brecha H2-QA: hasta ahora ningún caso de uso exponía las rutinas
 * predefinidas del catálogo fuera de `catalog`, así que "Mis rutinas" no
 * podía ofrecer "Duplicar y editar" sobre ellas — la lógica de
 * `DuplicateRoutine` (F03) existía pero nunca era alcanzable). Envoltorio
 * mínimo de solo lectura sobre `PredefinedRoutineRepository.all()`.
 */
export class ListPredefinedRoutines {
  constructor(private readonly repository: PredefinedRoutineRepository) {}

  async execute(): Promise<Result<PredefinedRoutine[], RepositoryError>> {
    return this.repository.all();
  }
}
