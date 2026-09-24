import { generateId } from "@/shared/domain/Id";
import { isErr, isOk, err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import { ScheduleSlot } from "../domain/ScheduleSlot";
import type { DayOfWeek } from "../domain/ScheduleSlot";
import { checkRestRules } from "../domain/RestRuleChecker";
import type { RestWarning } from "../domain/RestRuleChecker";
import type { RoutineScheduledEvent } from "../domain/events";
import type { RoutineSummary } from "../domain/NotificationPlanner";
import type {
  LastSessionQueryPort,
  RepositoryError,
  RoutineSummaryLookupPort,
  ScheduleSlotRepository,
  SchedulingPreferencesRepository,
} from "./ports";

export interface ScheduleRoutineCommand {
  routineId: Id;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  reminderOffsetMin: number;
}

export interface ScheduleRoutineResult {
  scheduleSlotId: Id;
  /** RN-13, no bloqueante (CA-04.04.1/CA-04.04.2): la programación se crea igual. */
  warnings: RestWarning[];
}

export type ScheduleRoutineError = RepositoryError | { kind: "INVALID_SLOT"; message: string };

export interface ScheduleRoutineDeps {
  scheduleSlotRepository: ScheduleSlotRepository;
  routineSummaryLookupPort: RoutineSummaryLookupPort;
  lastSessionQueryPort: LastSessionQueryPort;
  schedulingPreferencesRepository: SchedulingPreferencesRepository;
  eventBus: EventBus;
  clock: Clock;
}

/**
 * `ScheduleRoutine` (CA-04.01.1,
 * `specs/F04-programacion-recordatorios/plan.md` §2): crea un `ScheduleSlot`
 * activo y calcula las advertencias RN-13 (no bloqueantes). La
 * replanificación de notificaciones (`ReplanNotificationWindow`, ADR-010) se
 * dispara desde `composition/container.ts` al reaccionar a `RoutineScheduled`
 * (disparador 2 de ADR-010: "tras cualquier cambio de programación local"),
 * no aquí (este caso de uso no depende de `NotificationScheduler`).
 */
export class ScheduleRoutine {
  constructor(private readonly deps: ScheduleRoutineDeps) {}

  async execute(command: ScheduleRoutineCommand): Promise<Result<ScheduleRoutineResult, ScheduleRoutineError>> {
    const { scheduleSlotRepository, routineSummaryLookupPort, lastSessionQueryPort, schedulingPreferencesRepository, eventBus, clock } =
      this.deps;

    const summaryResult = await routineSummaryLookupPort.summarize(command.routineId);
    if (isErr(summaryResult)) {
      return err({ kind: "NOT_FOUND", message: "No se encontró la rutina a programar." });
    }
    const targetRoutine = summaryResult.value;

    const preferencesResult = await schedulingPreferencesRepository.load();
    if (isErr(preferencesResult)) {
      return preferencesResult;
    }
    const preferences = preferencesResult.value;

    const now = clock.now();
    const [lastSession, lastSessionSameMuscle] = await Promise.all([
      lastSessionQueryPort.lastSessionFor(),
      lastSessionQueryPort.lastSessionFor(targetRoutine.muscleGroups[0]),
    ]);

    const alternativeRoutines = await this.findAlternativeRoutines(command);

    const warnings: RestWarning[] = checkRestRules({
      now,
      targetRoutine,
      minHoursBetweenRoutines: preferences.minHoursBetweenRoutines,
      minHoursSameMuscle: preferences.minHoursSameMuscle,
      lastSession,
      lastSessionSameMuscle,
      alternativeRoutines,
    });

    const created = ScheduleSlot.create({
      id: generateId(clock),
      routineId: command.routineId,
      daysOfWeek: command.daysOfWeek,
      startTime: command.startTime,
      reminderOffsetMin: command.reminderOffsetMin,
      now,
    });
    if (isErr(created)) {
      return err({ kind: "INVALID_SLOT", message: created.error.message });
    }
    const slot = created.value;

    const saveResult = await scheduleSlotRepository.save(slot);
    if (isErr(saveResult)) {
      return saveResult;
    }

    const event: RoutineScheduledEvent = {
      type: "RoutineScheduled",
      occurredAt: now,
      scheduleSlotId: slot.id,
      routineId: slot.routineId,
      daysOfWeek: slot.daysOfWeek,
      startTime: slot.startTime,
    };
    await eventBus.publish(event);

    return ok({ scheduleSlotId: slot.id, warnings });
  }

  /**
   * CA-04.04.2, heurística acotada (`plan.md` §1 punto 3): otras rutinas ya
   * programadas en un `ScheduleSlot` activo para un día distinto del que se
   * está programando ahora.
   */
  private async findAlternativeRoutines(command: ScheduleRoutineCommand): Promise<RoutineSummary[]> {
    const { scheduleSlotRepository, routineSummaryLookupPort } = this.deps;
    const activeSlotsResult = await scheduleSlotRepository.listActive();
    if (isErr(activeSlotsResult)) {
      return [];
    }

    const candidateSlots = activeSlotsResult.value.filter(
      (slot) =>
        slot.routineId !== command.routineId &&
        !slot.daysOfWeek.some((day) => command.daysOfWeek.includes(day)),
    );

    const summaries = await Promise.all(
      candidateSlots.map((slot) => routineSummaryLookupPort.summarize(slot.routineId)),
    );
    return summaries.filter(isOk).map((result) => result.value);
  }
}
