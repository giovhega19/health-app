import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import { ScheduleSlot } from "../domain/ScheduleSlot";
import type { DayOfWeek } from "../domain/ScheduleSlot";
import { nextOccurrence } from "../domain/NotificationPlanner";
import type { RoutineSummary } from "../domain/NotificationPlanner";
import { checkRestRules } from "../domain/RestRuleChecker";
import type { LastSessionInfo, RestWarning } from "../domain/RestRuleChecker";
import type { RoutineScheduledEvent } from "../domain/events";
import type {
  RepositoryError,
  RestWarningStore,
  RoutineSummaryLookupPort,
  ScheduleSlotRepository,
  SchedulingPreferencesRepository,
} from "./ports";

const DEFAULT_REMINDER_OFFSET_MIN = 15;

/**
 * `RoutinesCreatedFromProposal` (payload público de `features/routines`,
 * `specs/F03-editor-rutinas/plan.md` §3), replicado aquí como forma
 * estructural mínima para no importar internos de `routines` (Art. 2.5): F04
 * solo necesita `routineId`/`dayNumber`/`preferredTime` de cada entrada, no
 * el tipo completo `DomainEvent` de `routines`.
 */
export interface RoutinesCreatedFromProposalPayload {
  routines: { routineId: Id; dayNumber: number; preferredTime: string }[];
}

export interface CreateScheduleSlotsFromProposalResult {
  createdCount: number;
  /** RN-13 (CA-04.04.1/CA-04.04.2), solo los slots con advertencia. */
  warnings: { scheduleSlotId: Id; warnings: RestWarning[] }[];
}

/**
 * `CreateScheduleSlotsFromProposal` (CA-02.04.3, cierre final — tarea
 * `F04-T09`, `specs/F04-programacion-recordatorios/plan.md` §1): suscriptor
 * de `RoutinesCreatedFromProposal` (emitido por `routines`, F03). Por cada
 * `Routine` recién creada desde una propuesta aceptada, crea el
 * `ScheduleSlot` correspondiente — cierra de punta a punta el ciclo
 * `ProposalAccepted` → `RoutinesCreatedFromProposal` → `ScheduleSlot` real.
 *
 * RN-13 (cierre de brecha H2-QA): este era el único flujo real que creaba
 * `ScheduleSlot`s sin pasar por `RestRuleChecker` — `ScheduleRoutine` (la
 * programación manual desde el calendario) sí lo evaluaba, pero una propuesta
 * de F02 puede generar varios `ScheduleSlot` en el mismo lote sin que exista
 * todavía ninguna sesión real completada (`LastSessionQueryPort` es un stub
 * en H2, `spec.md` §"Preguntas abiertas"), así que la única forma de que la
 * advertencia sea alcanzable de verdad en H2 es comparar los slots *entre
 * sí* dentro del propio lote: se invoca `checkRestRules` (dominio) tratando
 * la ocurrencia más próxima de cada slot ya creado como una sesión pasada
 * "hipotética" para los slots que se crean después en el mismo lote (mismo
 * criterio que usaría un usuario real mirando su calendario semanal).
 * `ScheduleRoutine` no encaja aquí sin más: su cálculo de advertencias
 * depende de `lastSessionQueryPort` (sesiones ya completadas), no de "otros
 * slots que se están creando ahora mismo" — por eso este caso de uso invoca
 * `RestRuleChecker` directamente en vez de delegar en `ScheduleRoutine`.
 */
export class CreateScheduleSlotsFromProposal {
  constructor(
    private readonly repository: ScheduleSlotRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly routineSummaryLookupPort?: RoutineSummaryLookupPort,
    private readonly schedulingPreferencesRepository?: SchedulingPreferencesRepository,
    private readonly restWarningStore?: RestWarningStore,
  ) {}

  async execute(
    payload: RoutinesCreatedFromProposalPayload,
  ): Promise<Result<CreateScheduleSlotsFromProposalResult, RepositoryError>> {
    let createdCount = 0;
    const batch: { scheduleSlotId: Id; occurrence: Date; summary: RoutineSummary }[] = [];

    for (const ref of payload.routines) {
      const now = this.clock.now();
      const dayOfWeek = toDayOfWeek(ref.dayNumber);
      const created = ScheduleSlot.create({
        id: generateId(this.clock),
        routineId: ref.routineId,
        daysOfWeek: [dayOfWeek],
        startTime: ref.preferredTime,
        reminderOffsetMin: DEFAULT_REMINDER_OFFSET_MIN,
        now,
      });
      if (!isOk(created)) {
        // Un día/hora inválidos (no debería ocurrir: `dayNumber` viene de
        // `WeeklyPlan`, 1-7, y `preferredTime` ya se valida en la UI de F02)
        // se omite en vez de abortar el resto del lote.
        continue;
      }

      const saveResult = await this.repository.save(created.value);
      if (!isOk(saveResult)) {
        return saveResult;
      }
      createdCount += 1;

      const event: RoutineScheduledEvent = {
        type: "RoutineScheduled",
        occurredAt: now,
        scheduleSlotId: created.value.id,
        routineId: created.value.routineId,
        daysOfWeek: created.value.daysOfWeek,
        startTime: created.value.startTime,
      };
      await this.eventBus.publish(event);

      if (this.routineSummaryLookupPort) {
        const summaryResult = await this.routineSummaryLookupPort.summarize(ref.routineId);
        if (isOk(summaryResult)) {
          batch.push({
            scheduleSlotId: created.value.id,
            occurrence: nextOccurrence(now, dayOfWeek, ref.preferredTime),
            summary: summaryResult.value,
          });
        }
      }
    }

    const warnings = await this.computeBatchWarnings(batch);
    if (this.restWarningStore && warnings.length > 0) {
      this.restWarningStore.record(warnings);
    }

    return ok({ createdCount, warnings });
  }

  /**
   * RN-13: por cada slot del lote, busca entre los demás slots del mismo
   * lote el más reciente que ocurra antes (cualquiera, y el más reciente que
   * comparta grupo muscular) y evalúa `checkRestRules` con esas ocurrencias
   * como si fueran "la última sesión" — la única forma de que la advertencia
   * sea real en H2 sin depender de sesiones completadas (ver comentario de
   * la clase).
   */
  private async computeBatchWarnings(
    batch: { scheduleSlotId: Id; occurrence: Date; summary: RoutineSummary }[],
  ): Promise<{ scheduleSlotId: Id; warnings: RestWarning[] }[]> {
    if (batch.length < 2 || !this.schedulingPreferencesRepository) {
      return [];
    }
    const preferencesResult = await this.schedulingPreferencesRepository.load();
    if (isErr(preferencesResult)) {
      return [];
    }
    const preferences = preferencesResult.value;

    const results: { scheduleSlotId: Id; warnings: RestWarning[] }[] = [];

    for (const current of batch) {
      let lastSession: LastSessionInfo | null = null;
      let lastSessionSameMuscle: LastSessionInfo | null = null;

      for (const other of batch) {
        if (other.scheduleSlotId === current.scheduleSlotId) {
          continue;
        }
        if (other.occurrence.getTime() > current.occurrence.getTime()) {
          continue; // solo cuentan como "sesión pasada" los slots que ocurren antes.
        }
        const candidate: LastSessionInfo = { completedAt: other.occurrence, muscleGroups: other.summary.muscleGroups };
        if (!lastSession || other.occurrence.getTime() > lastSession.completedAt.getTime()) {
          lastSession = candidate;
        }
        const sharesMuscle = other.summary.muscleGroups.some((muscleGroup) =>
          current.summary.muscleGroups.includes(muscleGroup),
        );
        if (
          sharesMuscle &&
          (!lastSessionSameMuscle || other.occurrence.getTime() > lastSessionSameMuscle.completedAt.getTime())
        ) {
          lastSessionSameMuscle = candidate;
        }
      }

      const alternativeRoutines = batch
        .filter((entry) => entry.scheduleSlotId !== current.scheduleSlotId)
        .map((entry) => entry.summary);

      const warnings = checkRestRules({
        now: current.occurrence,
        targetRoutine: current.summary,
        minHoursBetweenRoutines: preferences.minHoursBetweenRoutines,
        minHoursSameMuscle: preferences.minHoursSameMuscle,
        lastSession,
        lastSessionSameMuscle,
        alternativeRoutines,
      });

      if (warnings.length > 0) {
        results.push({ scheduleSlotId: current.scheduleSlotId, warnings });
      }
    }

    return results;
  }
}

/** `WeeklyPlanDay.dayNumber` (1-7, `catalog`) coincide con el ISO `DayOfWeek` que ya usa `scheduling`. */
function toDayOfWeek(dayNumber: number): DayOfWeek {
  const clamped = Math.min(7, Math.max(1, Math.round(dayNumber))) as DayOfWeek;
  return clamped;
}
