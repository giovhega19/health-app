import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ScheduleSlot } from "../domain/ScheduleSlot";
import type { SchedulingPreferences } from "../domain/SchedulingPreferences";
import type { PostponeCounter } from "../domain/PostponeCounter";
import type { NotificationType, PlannedNotification, RoutineSummary } from "../domain/NotificationPlanner";
import type { LastSessionInfo, RestWarning } from "../domain/RestRuleChecker";

/**
 * Puertos de `scheduling/application`
 * (`specs/F04-programacion-recordatorios/plan.md` §3).
 */
export interface RepositoryError {
  kind: "NOT_FOUND" | "STORAGE_ERROR" | "UNKNOWN";
  message?: string;
}

export interface NotificationError {
  kind: "PERMISSION_DENIED" | "SCHEDULING_FAILED" | "UNKNOWN";
  message?: string;
}

export interface ScheduleSlotRepository {
  save(slot: ScheduleSlot): Promise<Result<void, RepositoryError>>;
  listActive(): Promise<Result<ScheduleSlot[], RepositoryError>>;
  findById(id: Id): Promise<Result<ScheduleSlot | null, RepositoryError>>;
  cancel(id: Id): Promise<Result<void, RepositoryError>>;
  /**
   * Borra todos los horarios del dispositivo (CA-01.08.1/Art. 5.4, hallazgo
   * de seguridad H2 "Eliminar cuenta no purga datos locales de horarios").
   * Mismo contrato que `routines/application/ports.ts`'s `RoutineRepository.clear()`.
   */
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface PlannedNotificationContent {
  scheduleSlotId: Id;
  type: NotificationType;
  fireAt: Date;
  title: string;
  body: string;
  deepLink: string;
}

export interface NotificationScheduler {
  requestPermission(): Promise<Result<"GRANTED" | "DENIED", NotificationError>>;
  getPermissionStatus(): Promise<"GRANTED" | "DENIED" | "UNDETERMINED">;
  /** El `string` devuelto es el id de notificación del SO (para poder cancelarla luego). */
  schedule(notification: PlannedNotificationContent): Promise<Result<string, NotificationError>>;
  cancel(osNotificationId: string): Promise<Result<void, NotificationError>>;
  cancelAll(): Promise<Result<void, NotificationError>>;
}

/**
 * `PlannedNotification` + el id de notificación del SO al que corresponde
 * (`plan.md` §4: `planned_notifications`, "permite a `ReplanNotificationWindow`
 * saber qué cancelar en el SO antes de reprogramar"). 100 % local, nunca se
 * sincroniza.
 */
export interface PlannedNotificationRecord extends PlannedNotification {
  osNotificationId: string | null;
  delivered: boolean;
}

export interface PlannedNotificationRepository {
  listAll(): Promise<Result<PlannedNotificationRecord[], RepositoryError>>;
  replaceAll(notifications: PlannedNotificationRecord[]): Promise<Result<void, RepositoryError>>;
}

export interface SchedulingPreferencesRepository {
  load(): Promise<Result<SchedulingPreferences, RepositoryError>>;
  save(preferences: SchedulingPreferences): Promise<Result<void, RepositoryError>>;
}

export interface PostponeCounterRepository {
  get(date: string, scheduleSlotId: Id): Promise<Result<PostponeCounter, RepositoryError>>;
  save(counter: PostponeCounter): Promise<Result<void, RepositoryError>>;
}

/**
 * `LastSessionQueryPort`: en H2 solo existe una implementación *stub*
 * (`NullLastSessionAdapter`, siempre `null` — comportamiento seguro por
 * defecto, `plan.md` §1 punto 1). F05 (H3) añade la real sin cambiar
 * `scheduling`.
 */
export interface LastSessionQueryPort {
  lastSessionFor(muscleGroup?: MuscleGroup): Promise<LastSessionInfo | null>;
}

export type LookupError = { kind: "NOT_FOUND" | "UNKNOWN"; message?: string };

export interface RoutineSummaryLookupPort {
  summarize(routineId: Id): Promise<Result<RoutineSummary, LookupError>>;
}

/**
 * RN-13 (CA-04.04.1/CA-04.04.2, cierre de brecha H2-QA): sitio único donde
 * `CreateScheduleSlotsFromProposal` deja las advertencias de descanso que
 * calcula de verdad para que la presentación (`WeeklyCalendarScreen`) las
 * muestre — efímero, en memoria (no es un dato de negocio que deba
 * sobrevivir un reinicio de la app, solo "avisa justo después de aceptar la
 * propuesta"), por eso es un puerto propio y no una tabla de `ScheduleSlot`.
 */
export interface ScheduleSlotRestWarnings {
  scheduleSlotId: Id;
  warnings: RestWarning[];
}

export interface RestWarningStore {
  /** Upsert por `scheduleSlotId` (no borra advertencias de otros slots no incluidos en `entries`). */
  record(entries: ScheduleSlotRestWarnings[]): void;
  listAll(): ScheduleSlotRestWarnings[];
}
