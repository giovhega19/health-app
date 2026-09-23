import type { Result } from "@/shared/domain/Result";
import type { UserProfile } from "../domain/UserProfile";
import type { ProfileRepository, RepositoryError } from "./ports";

/**
 * `GetCurrentProfile` (RF-01.03/RF-01.06, tarea `F01-T16`): consulta de solo
 * lectura sobre `ProfileRepository.findCurrent()`, análoga a
 * `GetExerciseDetail` de `catalog` (`features/catalog/application/GetExerciseDetail.ts`).
 * La necesita la pantalla "Editar perfil" para precargar los valores
 * actuales antes de editarlos; no tenía caso de uso propio hasta ahora
 * porque ningún otro consumidor lo necesitaba (`CompleteOnboarding`/
 * `CreateAccount`/`ContinueAsGuest`/`LogBodyWeight` llaman a
 * `profileRepository.findCurrent()` directamente, al ser parte de su propio
 * flujo).
 */
export class GetCurrentProfile {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(): Promise<Result<UserProfile | null, RepositoryError>> {
    return this.profileRepository.findCurrent();
  }
}
