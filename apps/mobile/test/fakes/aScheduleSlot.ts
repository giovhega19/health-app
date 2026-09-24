import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import { ScheduleSlot } from "@/features/scheduling/domain/ScheduleSlot";
import type { DayOfWeek } from "@/features/scheduling/domain/ScheduleSlot";

export interface AScheduleSlotOverrides {
  id?: Id;
  routineId?: Id;
  daysOfWeek?: DayOfWeek[];
  startTime?: string;
  reminderOffsetMin?: number;
  now?: Date;
}

/**
 * Builder de `ScheduleSlot` (CA-04.01.1). Lanza si la validación no pasa: un
 * fixture inválido es un bug de la prueba, no algo que silenciar.
 */
export function aScheduleSlot(overrides: AScheduleSlotOverrides = {}): ScheduleSlot {
  const result = ScheduleSlot.create({
    id: overrides.id ?? asId("00000000-0000-4000-e200-000000000001"),
    routineId: overrides.routineId ?? asId("00000000-0000-4000-e100-000000000001"),
    daysOfWeek: overrides.daysOfWeek ?? [1],
    startTime: overrides.startTime ?? "18:00",
    reminderOffsetMin: overrides.reminderOffsetMin ?? 15,
    now: overrides.now ?? new Date("2026-09-21T08:00:00Z"),
  });
  if (!result.ok) {
    throw new Error(`aScheduleSlot: fixture inválido (${result.error.name}).`);
  }
  return result.value;
}
