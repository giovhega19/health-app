import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  ProfileSnapshot,
  ProposalError,
  RoutineProposalPort,
  WeeklyPlanSummary,
} from "@/features/profile/application/ports";

/**
 * Fake en memoria de `RoutineProposalPort` (el puerto que `profile/application`
 * declara y que `catalog/application/GenerateProposal.ts` implementa vía el
 * composition root, `specs/F01-perfil-onboarding/plan.md` §1/§3). Permite
 * probar `CompleteOnboarding`/`CompleteOnboarding.parq` sin depender de F02
 * (07-estrategia-pruebas.md §2.4).
 */
export class FakeRoutineProposalPort implements RoutineProposalPort {
  readonly calls: ProfileSnapshot[] = [];
  result: Result<WeeklyPlanSummary, ProposalError> = ok({ days: [] } as unknown as WeeklyPlanSummary);

  async propose(profile: ProfileSnapshot) {
    this.calls.push(profile);
    return this.result;
  }
}
