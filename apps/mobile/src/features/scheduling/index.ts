/**
 * API pública del módulo "scheduling" (F04). Ningún otro módulo debe
 * importar los internos de `scheduling` (domain/, application/,
 * infrastructure/, presentation/): solo este archivo (Art. 2.5 de la
 * constitución).
 *
 * `createSchedulingContainer` es lo que `src/composition/container.ts` usa
 * para cablear los casos de uso reales con sus adaptadores de infraestructura
 * (`specs/F04-programacion-recordatorios/plan.md` §3 "API pública").
 */
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";

import { ScheduleRoutine } from "./application/ScheduleRoutine";
import { ReplanNotificationWindow } from "./application/ReplanNotificationWindow";
import { PostponeNotification } from "./application/PostponeNotification";
import { RequestNotificationPermission } from "./application/RequestNotificationPermission";
import { CreateScheduleSlotsFromProposal } from "./application/CreateScheduleSlotsFromProposal";
import { ListActiveSlots } from "./application/ListActiveSlots";
import { CancelSlot } from "./application/CancelSlot";
import { InMemoryRestWarningStore } from "./infrastructure/InMemoryRestWarningStore";
import type {
  LastSessionQueryPort,
  NotificationScheduler,
  PlannedNotificationRepository,
  PostponeCounterRepository,
  RestWarningStore,
  RoutineSummaryLookupPort,
  ScheduleSlotRepository,
  SchedulingPreferencesRepository,
} from "./application/ports";

export type {
  LastSessionQueryPort,
  LookupError,
  NotificationError,
  NotificationScheduler,
  PlannedNotificationContent,
  PlannedNotificationRecord,
  PlannedNotificationRepository,
  PostponeCounterRepository,
  RepositoryError,
  RestWarningStore,
  RoutineSummaryLookupPort,
  ScheduleSlotRepository,
  ScheduleSlotRestWarnings,
  SchedulingPreferencesRepository,
} from "./application/ports";
export type { ScheduleSlot, DayOfWeek } from "./domain/ScheduleSlot";
export type { SchedulingPreferences, QuietHours } from "./domain/SchedulingPreferences";
export type { NotificationType, PlannedNotification, RoutineSummary } from "./domain/NotificationPlanner";
export type { RestWarning } from "./domain/RestRuleChecker";
export { buildSessionStartDeepLink } from "./domain/deepLink";
export type {
  CreateScheduleSlotsFromProposalResult,
  RoutinesCreatedFromProposalPayload,
} from "./application/CreateScheduleSlotsFromProposal";

export interface SchedulingDeps {
  scheduleSlotRepository: ScheduleSlotRepository;
  plannedNotificationRepository: PlannedNotificationRepository;
  notificationScheduler: NotificationScheduler;
  routineSummaryLookupPort: RoutineSummaryLookupPort;
  schedulingPreferencesRepository: SchedulingPreferencesRepository;
  postponeCounterRepository: PostponeCounterRepository;
  lastSessionQueryPort: LastSessionQueryPort;
  eventBus: EventBus;
  clock: Clock;
  /** Opcional: por defecto usa `InMemoryRestWarningStore` (mismo patrón que `InMemoryEventBus`). */
  restWarningStore?: RestWarningStore;
}

export function createSchedulingContainer(deps: SchedulingDeps): {
  scheduleRoutine: ScheduleRoutine;
  replanNotificationWindow: ReplanNotificationWindow;
  postponeNotification: PostponeNotification;
  requestNotificationPermission: RequestNotificationPermission;
  listActiveSlots: ListActiveSlots;
  /** CA-04.01.2 "Reprogramación coherente": punto de entrada real para cancelar un `ScheduleSlot` (`WeeklyCalendarScreen`). */
  cancelSlot: CancelSlot;
  /** Uso exclusivo de `composition/container.ts` al suscribirse a `RoutinesCreatedFromProposal`. */
  createScheduleSlotsFromProposal: CreateScheduleSlotsFromProposal;
  /**
   * RN-13 (CA-04.04.1/CA-04.04.2): expuesto para que la presentación
   * (`WeeklyCalendarScreen`) lea las advertencias que `CreateScheduleSlotsFromProposal`
   * calculó de verdad — mismo patrón que `clock` en `AppContainer` (puerto
   * expuesto directamente, sin caso de uso intermedio de una sola línea).
   */
  restWarningStore: RestWarningStore;
} {
  const restWarningStore = deps.restWarningStore ?? new InMemoryRestWarningStore();

  return {
    restWarningStore,
    listActiveSlots: new ListActiveSlots(deps.scheduleSlotRepository),
    cancelSlot: new CancelSlot({
      scheduleSlotRepository: deps.scheduleSlotRepository,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    scheduleRoutine: new ScheduleRoutine({
      scheduleSlotRepository: deps.scheduleSlotRepository,
      routineSummaryLookupPort: deps.routineSummaryLookupPort,
      lastSessionQueryPort: deps.lastSessionQueryPort,
      schedulingPreferencesRepository: deps.schedulingPreferencesRepository,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    replanNotificationWindow: new ReplanNotificationWindow({
      scheduleSlotRepository: deps.scheduleSlotRepository,
      plannedNotificationRepository: deps.plannedNotificationRepository,
      notificationScheduler: deps.notificationScheduler,
      routineSummaryLookupPort: deps.routineSummaryLookupPort,
      schedulingPreferencesRepository: deps.schedulingPreferencesRepository,
      postponeCounterRepository: deps.postponeCounterRepository,
      clock: deps.clock,
    }),
    postponeNotification: new PostponeNotification({
      postponeCounterRepository: deps.postponeCounterRepository,
      notificationScheduler: deps.notificationScheduler,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    requestNotificationPermission: new RequestNotificationPermission({
      notificationScheduler: deps.notificationScheduler,
    }),
    createScheduleSlotsFromProposal: new CreateScheduleSlotsFromProposal(
      deps.scheduleSlotRepository,
      deps.eventBus,
      deps.clock,
      deps.routineSummaryLookupPort,
      deps.schedulingPreferencesRepository,
      restWarningStore,
    ),
  };
}
