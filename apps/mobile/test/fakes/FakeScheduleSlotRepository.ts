import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { ScheduleSlotRepository } from "@/features/scheduling/application/ports";
import type { ScheduleSlot } from "@/features/scheduling/domain/ScheduleSlot";

/** Fake en memoria de `ScheduleSlotRepository` (`features/scheduling/application/ports.ts`). */
export class FakeScheduleSlotRepository implements ScheduleSlotRepository {
  readonly saved: ScheduleSlot[] = [];
  private readonly byId = new Map<string, ScheduleSlot>();

  constructor(seed: ScheduleSlot[] = []) {
    for (const slot of seed) {
      this.byId.set(slot.id, slot);
    }
  }

  async save(slot: ScheduleSlot) {
    this.byId.set(slot.id, slot);
    this.saved.push(slot);
    return ok(undefined);
  }

  async listActive() {
    return ok([...this.byId.values()].filter((slot) => slot.active));
  }

  async findById(id: Id) {
    return ok(this.byId.get(id) ?? null);
  }

  async cancel(id: Id) {
    const slot = this.byId.get(id);
    if (slot) {
      this.byId.set(id, slot.cancel(new Date()));
    }
    return ok(undefined);
  }

  clearCalls = 0;

  async clear() {
    this.clearCalls += 1;
    this.byId.clear();
    return ok(undefined);
  }
}
