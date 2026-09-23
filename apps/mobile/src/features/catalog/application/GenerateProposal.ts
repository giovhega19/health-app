import { err, isOk } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { RecommendationEngine } from "../domain/RecommendationEngine";
import type { RecommendationInput } from "../domain/RecommendationEngine";
import type { WeeklyPlan } from "../domain/WeeklyPlan";
import type { RecommendationError } from "../domain/errors";
import type { ExerciseRepository, ProfileSnapshot } from "./ports";

/**
 * `GenerateProposal` (RF-02.04, tarea `F02-T10`): implementa la forma de
 * `RoutineProposalPort` de F01 (`specs/F01-perfil-onboarding/plan.md` §3),
 * expuesta en `features/catalog/index.ts`. Traduce un `ProfileSnapshot` de
 * solo lectura a `RecommendationInput` y delega en `RecommendationEngine`
 * (RN-14) con el catálogo cargado desde `ExerciseRepository`.
 */
export class GenerateProposal {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(profile: ProfileSnapshot): Promise<Result<WeeklyPlan, RecommendationError>> {
    const exercisesResult = await this.exercises.filter({});
    if (!isOk(exercisesResult)) {
      return err({ kind: "NO_COMPATIBLE_EXERCISES" });
    }

    const input: RecommendationInput = {
      goal: profile.goal,
      level: profile.level,
      daysPerWeek: profile.daysPerWeek,
      minutesPerSession: profile.minutesPerSession,
      equipment: profile.equipment,
      parqFlagged: profile.parqFlagged,
    };

    return RecommendationEngine.generate(input, { exercises: exercisesResult.value, routines: [] });
  }
}
