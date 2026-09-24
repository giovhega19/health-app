import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { AccountDeletedEvent } from "../domain/events";
import type { AuthError, AuthPort, BodyMetricRepository, ProfileRepository, RepositoryError, StorageError, TokenStoragePort } from "./ports";

/**
 * `DeleteAccount` (RF-01.08, tarea `F01-T12`). CA-01.08.1: llama primero a
 * `AuthPort.deleteAccount()` (`DELETE /me`); solo si el servidor acepta la
 * eliminación se borran los datos locales (perfil, historial de peso y
 * tokens) — si el servidor la rechaza (token inválido/expirado), los datos
 * locales NO se tocan todavía.
 *
 * Tras limpiar sus propios datos, publica `AccountDeleted` (hallazgo de
 * seguridad H2): `profile` no conoce ni importa `routines`/`scheduling`
 * (Art. 2.5), así que la purga de rutinas/horarios/notificaciones de esas
 * features vive en `composition/container.ts`, suscrito a este evento (mismo
 * patrón que el `AccountDeletedListener` del backend).
 */
export interface DeleteAccountDeps {
  authPort: AuthPort;
  profileRepository: ProfileRepository;
  bodyMetricRepository: BodyMetricRepository;
  tokenStoragePort: TokenStoragePort;
  eventBus: EventBus;
  clock: Clock;
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

    const event: AccountDeletedEvent = {
      type: "AccountDeleted",
      occurredAt: this.deps.clock.now(),
    };
    await this.deps.eventBus.publish(event);

    return ok(undefined);
  }
}
