import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  AuthSession,
  StorageError,
  TokenStoragePort,
} from "@/features/profile/application/ports";

/**
 * Fake en memoria de `TokenStoragePort` (sustituye a `SecureTokenStorage`
 * sobre `expo-secure-store`; sin acceso real a almacenamiento seguro,
 * 07-estrategia-pruebas.md §2.3/2.4).
 */
export class FakeTokenStoragePort implements TokenStoragePort {
  saved: AuthSession | null = null;
  readonly saveCalls: AuthSession[] = [];
  clearCalls = 0;

  saveResult: Result<void, StorageError> = ok(undefined);
  clearResult: Result<void, StorageError> = ok(undefined);

  async save(session: AuthSession) {
    this.saveCalls.push(session);
    this.saved = session;
    return this.saveResult;
  }

  async clear() {
    this.clearCalls += 1;
    this.saved = null;
    return this.clearResult;
  }
}
