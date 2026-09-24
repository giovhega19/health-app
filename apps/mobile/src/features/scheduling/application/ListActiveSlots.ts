import type { Result } from "@/shared/domain/Result";
import type { ScheduleSlot } from "../domain/ScheduleSlot";
import type { RepositoryError, ScheduleSlotRepository } from "./ports";

/** `ListActiveSlots` (CA-04.01.1, calendario semanal). */
export class ListActiveSlots {
  constructor(private readonly repository: ScheduleSlotRepository) {}

  async execute(): Promise<Result<ScheduleSlot[], RepositoryError>> {
    return this.repository.listActive();
  }
}
