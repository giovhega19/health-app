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
import { ListPredefinedRoutines } from "./application/ListPredefinedRoutines";
import type { WeeklyPlanSummary } from "./domain/WeeklyPlan";
import type { ProposalError } from "./domain/errors";
import type { Result } from "@/shared/domain/Result";

export type { ProfileSnapshot, ExerciseRepository, PredefinedRoutineRepository, RepositoryError } from "./application/ports";
export type { WeeklyPlanSummary, WeeklyPlan, WeeklyPlanDay } from "./domain/WeeklyPlan";
export type { ProposalError, RecommendationError, ExerciseNotFoundError } from "./domain/errors";
// CA-03.05.1 ("Predefinidas protegidas", cierre de brecha H2-QA): tipo de
// solo lectura que `routines` (F03) consume para ofrecer "Duplicar y editar"
// sin importar internos de `catalog` (Art. 2.5).
export type { PredefinedRoutine } from "./domain/PredefinedRoutine";
// F03-T02 (`specs/F03-editor-rutinas/plan.md` §3 "Requisito de fontanería
// previo"): adición pura (sin cambio de comportamiento) para que `routines`
// pueda tipar su suscripción a `ProposalAccepted` sin importar internos de
// `catalog` (Art. 2.5).
export type { ProposalAcceptedEvent, PreferredScheduleEntry } from "./domain/events";

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
  listPredefinedRoutines: ListPredefinedRoutines;
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
    listPredefinedRoutines: new ListPredefinedRoutines(deps.routineRepository),
  };
}
