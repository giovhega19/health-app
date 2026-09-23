import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { AuthError, RemoteProfilePort } from "@/features/profile/application/ports";
import type { UserProfile } from "@/features/profile/domain/UserProfile";

/**
 * Fake en memoria de `RemoteProfilePort` (sustituye a `HttpProfileAdapter`;
 * sin red real, 07-estrategia-pruebas.md §2.3/2.4). Usado por
 * `UpdateProfile.test.ts`.
 */
export class FakeRemoteProfilePort implements RemoteProfilePort {
  readonly updateCalls: UserProfile[] = [];
  updateResult: Result<void, AuthError> = ok(undefined);

  async update(profile: UserProfile) {
    this.updateCalls.push(profile);
    return this.updateResult;
  }
}
