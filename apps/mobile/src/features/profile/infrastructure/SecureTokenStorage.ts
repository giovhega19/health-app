import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { SecureStoreAdapter } from "@/shared/infrastructure/secure-storage";
import type { AuthSession, StorageError, TokenStoragePort } from "../application/ports";

const SESSION_KEY = "fitapp.auth.session";

/**
 * `SecureTokenStorage` (tarea `F01-T10`): implementa `TokenStoragePort`
 * sobre `expo-secure-store` (`shared/infrastructure/secure-storage`). Nunca
 * guarda los tokens en SQLite (Art. 5 de la constitución): la sesión
 * completa (`AuthSession`, incluido `accessToken`/`refreshToken`) se
 * serializa como un único JSON en el almacén cifrado del sistema operativo.
 */
export class SecureTokenStorage implements TokenStoragePort {
  constructor(private readonly secureStore: SecureStoreAdapter) {}

  async save(session: AuthSession): Promise<Result<void, StorageError>> {
    try {
      await this.secureStore.setItem(SESSION_KEY, JSON.stringify(session));
      return ok(undefined);
    } catch (error) {
      return err(toStorageError(error));
    }
  }

  async clear(): Promise<Result<void, StorageError>> {
    try {
      await this.secureStore.deleteItem(SESSION_KEY);
      return ok(undefined);
    } catch (error) {
      return err(toStorageError(error));
    }
  }

  async loadSession(): Promise<AuthSession | null> {
    const raw = await this.secureStore.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }
}

function toStorageError(error: unknown): StorageError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
