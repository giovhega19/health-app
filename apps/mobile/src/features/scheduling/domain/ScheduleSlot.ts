import { Entity } from "@/shared/domain/Entity";
import type { Id } from "@/shared/domain/Id";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { InvalidReminderOffsetError, InvalidStartTimeError, NoDaysSelectedError } from "./errors";

/**
 * ISO-8601: 1 = lunes ... 7 = domingo (calendario semanal, CA-04.01.1).
 */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const START_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ScheduleSlotProps {
  routineId: Id;
  daysOfWeek: DayOfWeek[];
  startTime: string; // "HH:mm"
  reminderOffsetMin: number;
  active: boolean;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ScheduleSlotCreateInput {
  id: Id;
  routineId: Id;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  reminderOffsetMin: number;
  now: Date;
}

export type ScheduleSlotValidationError = NoDaysSelectedError | InvalidStartTimeError | InvalidReminderOffsetError;

/**
 * `ScheduleSlot` (CA-04.01.1, `specs/F04-programacion-recordatorios/plan.md`
 * §2): agregado de "una rutina asignada a uno o más días de la semana, a una
 * hora, con un aviso previo". Entidad inmutable (cada mutación devuelve una
 * instancia nueva, mismo patrón que `UserProfile`/`Routine`). Andamiaje
 * fundacional de la fase roja: se implementa de verdad (no es la lógica de
 * negocio bajo prueba, es la estructura de datos que las pruebas de
 * `NotificationPlanner`/`ScheduleRoutine`/etc. necesitan para poder
 * construir sus fixtures y fallar por la razón correcta).
 */
export class ScheduleSlot extends Entity<ScheduleSlotProps> {
  private constructor(id: Id, props: ScheduleSlotProps) {
    super(id, props);
  }

  static create(input: ScheduleSlotCreateInput): Result<ScheduleSlot, ScheduleSlotValidationError> {
    if (input.daysOfWeek.length === 0) {
      return err(new NoDaysSelectedError());
    }
    if (!START_TIME_PATTERN.test(input.startTime)) {
      return err(new InvalidStartTimeError());
    }
    if (input.reminderOffsetMin < 0) {
      return err(new InvalidReminderOffsetError());
    }
    const uniqueSortedDays = [...new Set(input.daysOfWeek)].sort((a, b) => a - b) as DayOfWeek[];
    return ok(
      new ScheduleSlot(input.id, {
        routineId: input.routineId,
        daysOfWeek: uniqueSortedDays,
        startTime: input.startTime,
        reminderOffsetMin: input.reminderOffsetMin,
        active: true,
        updatedAt: input.now,
        deletedAt: null,
      }),
    );
  }

  static fromPersistence(id: Id, props: ScheduleSlotProps): ScheduleSlot {
    return new ScheduleSlot(id, props);
  }

  get routineId(): Id {
    return this.props.routineId;
  }

  get daysOfWeek(): DayOfWeek[] {
    return [...this.props.daysOfWeek];
  }

  get startTime(): string {
    return this.props.startTime;
  }

  get reminderOffsetMin(): number {
    return this.props.reminderOffsetMin;
  }

  get active(): boolean {
    return this.props.active;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  /** CA-04.01.2: cancelar un slot lo desactiva (borrado lógico, RN-18). */
  cancel(now: Date): ScheduleSlot {
    return new ScheduleSlot(this.id, { ...this.props, active: false, deletedAt: now, updatedAt: now });
  }

  /** CA-04.01.2: editar un slot devuelve una nueva instancia (inmutabilidad). */
  withSchedule(
    daysOfWeek: DayOfWeek[],
    startTime: string,
    reminderOffsetMin: number,
    now: Date,
  ): Result<ScheduleSlot, ScheduleSlotValidationError> {
    return ScheduleSlot.create({
      id: this.id,
      routineId: this.props.routineId,
      daysOfWeek,
      startTime,
      reminderOffsetMin,
      now,
    });
  }
}
