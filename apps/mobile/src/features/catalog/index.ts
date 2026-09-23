/**
 * API pública del módulo "catalog" (F02). Ningún otro módulo debe importar
 * los internos de `catalog` (domain/, application/, infrastructure/,
 * presentation/): solo este archivo (Art. 2.5 de la constitución).
 *
 * `createCatalogContainer` es lo que `src/composition/container.ts` usa para
 * construir `generateProposal`, la implementación real de `RoutineProposalPort`
 * de F01 (`specs/F02-catalogo-propuesta/plan.md` §3,
 * `specs/F01-perfil-onboarding/plan.md` §1 "punto de integración único").
 */
import type {
  CatalogManifestPort,
  ExerciseRepository,
  MediaCachePort,
  PredefinedRoutineRepository,
  ProfileSnapshot,
} from "./application/ports";
import { GenerateProposal } from "./application/GenerateProposal";
import { FilterExercises } from "./application/FilterExercises";
import { GetExerciseDetail } from "./application/GetExerciseDetail";
import { DownloadCatalogUpdate } from "./application/DownloadCatalogUpdate";
import type { WeeklyPlanSummary } from "./domain/WeeklyPlan";
import type { ProposalError } from "./domain/errors";
import type { Result } from "@/shared/domain/Result";

export type { ProfileSnapshot, ExerciseRepository, PredefinedRoutineRepository } from "./application/ports";
export type { WeeklyPlanSummary, WeeklyPlan, WeeklyPlanDay } from "./domain/WeeklyPlan";
export type { ProposalError, RecommendationError, ExerciseNotFoundError } from "./domain/errors";

export interface CatalogDeps {
  exerciseRepository: ExerciseRepository;
  routineRepository: PredefinedRoutineRepository;
  manifestPort: CatalogManifestPort;
  mediaCachePort: MediaCachePort;
}

export function createCatalogContainer(deps: CatalogDeps): {
  generateProposal: (profile: ProfileSnapshot) => Promise<Result<WeeklyPlanSummary, ProposalError>>;
  filterExercises: FilterExercises;
  getExerciseDetail: GetExerciseDetail;
  downloadCatalogUpdate: DownloadCatalogUpdate;
} {
  const generateProposalUseCase = new GenerateProposal(deps.exerciseRepository);

  return {
    generateProposal: (profile) => generateProposalUseCase.execute(profile),
    filterExercises: new FilterExercises(deps.exerciseRepository),
    getExerciseDetail: new GetExerciseDetail(deps.exerciseRepository),
    downloadCatalogUpdate: new DownloadCatalogUpdate(
      deps.manifestPort,
      deps.exerciseRepository,
      deps.routineRepository,
    ),
  };
}
