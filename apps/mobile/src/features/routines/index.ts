/**
 * API pública del módulo "routines" (F03). Ningún otro módulo debe importar
 * los internos de `routines` (domain/, application/, infrastructure/,
 * presentation/): solo este archivo (Art. 2.5 de la constitución).
 *
 * `createRoutinesContainer` es lo que `src/composition/container.ts` usa
 * para cablear los casos de uso reales con sus adaptadores de infraestructura
 * (`specs/F03-editor-rutinas/plan.md` §3 "API pública").
 */
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { TimerSettings } from "@/shared/domain/TimerSettings";

import { CreateRoutine } from "./application/CreateRoutine";
import { DuplicateRoutine } from "./application/DuplicateRoutine";
import { ReorderRoutineItems } from "./application/ReorderRoutineItems";
import { RemoveRoutineItem } from "./application/RemoveRoutineItem";
import { PreviewImportRoutine } from "./application/PreviewImportRoutine";
import { ConfirmImportRoutine } from "./application/ConfirmImportRoutine";
import { ExportRoutine } from "./application/ExportRoutine";
import { CreateCustomExercise } from "./application/CreateCustomExercise";
import { ListMyRoutines } from "./application/ListMyRoutines";
import { GetRoutineDetail } from "./application/GetRoutineDetail";
import { CreateRoutinesFromProposal } from "./application/CreateRoutinesFromProposal";
import type {
  CustomExerciseRepository,
  ExerciseDisplayLookupPort,
  FileGateway,
  RoutineRepository,
} from "./application/ports";

export type {
  CustomExerciseRepository,
  ExerciseDisplayLookupPort,
  ExerciseDisplaySummary,
  ExerciseRef,
  FileGateway,
  PickedFile,
  PredefinedRoutineSnapshot,
  RoutineRepository,
} from "./application/ports";
export type { Routine, RoutineSource } from "./domain/Routine";
export type { CustomExercise } from "./domain/CustomExercise";
export type { RoutineValidationError, RepositoryError, ImportError, ImportWarning } from "./domain/errors";
export type { RoutinesCreatedFromProposalEvent, RoutineFromProposalRef } from "./domain/events";

export interface RoutinesDeps {
  routineRepository: RoutineRepository;
  customExerciseRepository: CustomExerciseRepository;
  fileGateway: FileGateway;
  exerciseDisplayLookupPort: ExerciseDisplayLookupPort;
  eventBus: EventBus;
  clock: Clock;
  appTimerDefaults: TimerSettings;
}

export function createRoutinesContainer(deps: RoutinesDeps): {
  createRoutine: CreateRoutine;
  duplicateRoutine: DuplicateRoutine;
  reorderItems: ReorderRoutineItems;
  removeItem: RemoveRoutineItem;
  previewImportRoutine: PreviewImportRoutine;
  confirmImportRoutine: ConfirmImportRoutine;
  exportRoutine: ExportRoutine;
  createCustomExercise: CreateCustomExercise;
  listMyRoutines: ListMyRoutines;
  getRoutineDetail: GetRoutineDetail;
  /** Uso exclusivo de `composition/container.ts` al suscribirse a `ProposalAccepted`. */
  createRoutinesFromProposal: CreateRoutinesFromProposal;
  /**
   * CA-03.08.2 ("Importar"): `presentation/screens/ImportPreview.tsx` lo usa
   * para elegir el archivo antes de llamar a `previewImportRoutine`. Mismo
   * puerto que ya usa `exportRoutine` internamente, expuesto aquí en vez de
   * duplicar un caso de uso de una sola línea (`pickFile()` ya es la API
   * mínima y completa que la pantalla necesita).
   */
  pickImportFile: FileGateway["pickFile"];
  appTimerDefaults: TimerSettings;
} {
  return {
    createRoutine: new CreateRoutine(deps.routineRepository, deps.clock, deps.appTimerDefaults),
    duplicateRoutine: new DuplicateRoutine(deps.routineRepository, deps.clock),
    reorderItems: new ReorderRoutineItems(deps.routineRepository),
    removeItem: new RemoveRoutineItem(deps.routineRepository),
    previewImportRoutine: new PreviewImportRoutine(deps.clock, deps.appTimerDefaults),
    confirmImportRoutine: new ConfirmImportRoutine(deps.routineRepository, deps.clock, deps.eventBus, deps.appTimerDefaults),
    exportRoutine: new ExportRoutine(deps.fileGateway, deps.clock, deps.exerciseDisplayLookupPort),
    createCustomExercise: new CreateCustomExercise(deps.customExerciseRepository, deps.clock),
    listMyRoutines: new ListMyRoutines(deps.routineRepository),
    getRoutineDetail: new GetRoutineDetail(deps.routineRepository),
    createRoutinesFromProposal: new CreateRoutinesFromProposal(
      deps.routineRepository,
      deps.eventBus,
      deps.clock,
      deps.appTimerDefaults,
    ),
    pickImportFile: (...args) => deps.fileGateway.pickFile(...args),
    appTimerDefaults: deps.appTimerDefaults,
  };
}
