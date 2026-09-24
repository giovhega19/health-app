import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { LastSessionQueryPort } from "../application/ports";
import type { LastSessionInfo } from "../domain/RestRuleChecker";

/**
 * `NullLastSessionAdapter` (RN-13, `specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 1): *stub* de H2 mientras `workout-session` (F05, H3) no existe.
 * Siempre devuelve `null` — comportamiento seguro por defecto: `RestRuleChecker`
 * nunca advierte de más, solo deja de advertir cuando debería (documentado
 * también en `spec.md` §"Preguntas abiertas"). F05 sustituye este adaptador
 * por uno real en `composition/container.ts` sin tocar código de `scheduling`.
 */
export class NullLastSessionAdapter implements LastSessionQueryPort {
  async lastSessionFor(_muscleGroup?: MuscleGroup): Promise<LastSessionInfo | null> {
    return null;
  }
}
