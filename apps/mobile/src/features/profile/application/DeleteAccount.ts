import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { AuthError, AuthPort, BodyMetricRepository, ProfileRepository, RepositoryError, StorageError, TokenStoragePort } from "./ports";

/**
 * `DeleteAccount` (RF-01.08, tarea `F01-T12`). CA-01.08.1: llama primero a
 * `AuthPort.deleteAccount()` (`DELETE /me`); solo si el servidor acepta la
 * eliminación se borran los datos locales (perfil, historial de peso y
 * tokens) — si el servidor la rechaza (token inválido/expirado), los datos
 * locales NO se tocan todavía.
 */
export interface DeleteAccountDeps {
  authPort: AuthPort;
  profileRepository: ProfileRepository;
  bodyMetricRepository: BodyMetricRepository;
  tokenStoragePort: TokenStoragePort;
}

export type DeleteAccountError = AuthError | RepositoryError | StorageError;

export class DeleteAccount {
  constructor(private readonly deps: DeleteAccountDeps) {}

  async execute(): Promise<Result<void, DeleteAccountError>> {
    const deleteResult = await this.deps.authPort.deleteAccount();
    if (!deleteResult.ok) {
      return deleteResult;
    }

    const clearProfileResult = await this.deps.profileRepository.clear();
    if (!clearProfileResult.ok) {
      return clearProfileResult;
    }

    const clearMetricsResult = await this.deps.bodyMetricRepository.clear();
    if (!clearMetricsResult.ok) {
      return clearMetricsResult;
    }

    const clearTokensResult = await this.deps.tokenStoragePort.clear();
    if (!clearTokensResult.ok) {
      return clearTokensResult;
    }

    return ok(undefined);
  }
}
