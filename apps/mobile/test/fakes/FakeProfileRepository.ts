import { ok } from "@/shared/domain/Result";
import type { ProfileRepository } from "@/features/profile/application/ports";
import type { UserProfile } from "@/features/profile/domain/UserProfile";

/**
 * Fake en memoria de `ProfileRepository` (`features/profile/application/ports.ts`,
 * `specs/F01-perfil-onboarding/plan.md` §3). "Fakes antes que mocks para los
 * puertos de repositorio" (07-estrategia-pruebas.md §2.4).
 *
 * Contrato asumido por las pruebas de este paquete: además de `save`/
 * `findCurrent` (los únicos dos métodos listados en `plan.md` §3), expone
 * `clear()` para el borrado local exigido por CA-01.08.1/Art. 5.4
 * (`DeleteAccount.test.ts`). Si `dev-mobile-rn` prefiere otro nombre/forma al
 * implementar `F01-T09`/`F01-T12`, se ajusta este fake junto con el puerto
 * real, sin que eso invalide las demás pruebas de este archivo.
 */
export class FakeProfileRepository implements ProfileRepository {
  current: UserProfile | null;
  readonly savedProfiles: UserProfile[] = [];
  clearCalls = 0;

  constructor(seed: UserProfile | null = null) {
    this.current = seed;
  }

  async save(profile: UserProfile) {
    this.current = profile;
    this.savedProfiles.push(profile);
    return ok(undefined);
  }

  async findCurrent() {
    return ok(this.current);
  }

  async clear() {
    this.clearCalls += 1;
    this.current = null;
    return ok(undefined);
  }
}
