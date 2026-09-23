import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";

/**
 * `WeeklyPlan` (RF-02.04, RN-14): resultado del `RecommendationEngine`.
 * `WeeklyPlanSummary` (re-exportado por `features/catalog/index.ts` para
 * `RoutineProposalPort` de F01, `specs/F01-perfil-onboarding/plan.md` §3) es
 * el mismo tipo, con otro nombre para el contrato público entre features.
 */
export interface WeeklyPlanDay {
  dayNumber: number;
  routine: {
    timerDefaults: TimerSettings;
    blocks: RoutineBlock[];
  };
  estimatedDurationSeconds: number;
}

export interface WeeklyPlan {
  days: WeeklyPlanDay[];
}

export type WeeklyPlanSummary = WeeklyPlan;
