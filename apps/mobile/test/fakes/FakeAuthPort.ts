import { asId } from "@/shared/domain/Id";
import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  AuthError,
  AuthPort,
  AuthSession,
  LoginInput,
  RegisterInput,
} from "@/features/profile/application/ports";

function defaultSession(): AuthSession {
  return {
    accessToken: "fake-access-token",
    refreshToken: "fake-refresh-token",
    user: { id: asId("00000000-0000-4000-a000-000000000099"), email: "fake-user@fitapp.test" },
  };
}

/**
 * Fake en memoria de `AuthPort` (sustituye a `HttpAuthAdapter`; sin red real,
 * 07-estrategia-pruebas.md §2.3/2.4).
 */
export class FakeAuthPort implements AuthPort {
  readonly registerCalls: RegisterInput[] = [];
  readonly loginCalls: LoginInput[] = [];
  readonly guestUpgradeCalls: RegisterInput[] = [];
  deleteAccountCalls = 0;

  registerResult: Result<AuthSession, AuthError> = ok(defaultSession());
  loginResult: Result<AuthSession, AuthError> = ok(defaultSession());
  guestUpgradeResult: Result<AuthSession, AuthError> = ok(defaultSession());
  deleteAccountResult: Result<void, AuthError> = ok(undefined);

  async register(input: RegisterInput) {
    this.registerCalls.push(input);
    return this.registerResult;
  }

  async login(input: LoginInput) {
    this.loginCalls.push(input);
    return this.loginResult;
  }

  async guestUpgrade(input: RegisterInput) {
    this.guestUpgradeCalls.push(input);
    return this.guestUpgradeResult;
  }

  async deleteAccount() {
    this.deleteAccountCalls += 1;
    return this.deleteAccountResult;
  }
}
