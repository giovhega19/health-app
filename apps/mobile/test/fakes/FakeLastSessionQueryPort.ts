import type { LastSessionQueryPort } from "@/features/scheduling/application/ports";
import type { LastSessionInfo } from "@/features/scheduling/domain/RestRuleChecker";

/**
 * Fake configurable de `LastSessionQueryPort` (`plan.md` §3). En pruebas de
 * `RestRuleChecker` (dominio) se inyecta `LastSessionInfo` directamente sin
 * pasar por ningún puerto; este fake se usa solo en pruebas de aplicación
 * (`ScheduleRoutine`) que sí dependen del puerto. Por defecto se comporta
 * como `NullLastSessionAdapter` (siempre `null`, comportamiento seguro por
 * defecto, `plan.md` §1 punto 1).
 */
export class FakeLastSessionQueryPort implements LastSessionQueryPort {
  response: LastSessionInfo | null = null;

  async lastSessionFor(): Promise<LastSessionInfo | null> {
    return this.response;
  }
}
