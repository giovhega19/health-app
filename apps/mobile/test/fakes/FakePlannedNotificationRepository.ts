import { ok } from "@/shared/domain/Result";
import type {
  PlannedNotificationRecord,
  PlannedNotificationRepository,
} from "@/features/scheduling/application/ports";

/** Fake en memoria de `PlannedNotificationRepository` (`features/scheduling/application/ports.ts`). */
export class FakePlannedNotificationRepository implements PlannedNotificationRepository {
  records: PlannedNotificationRecord[];

  constructor(seed: PlannedNotificationRecord[] = []) {
    this.records = [...seed];
  }

  async listAll() {
    return ok([...this.records]);
  }

  async replaceAll(notifications: PlannedNotificationRecord[]) {
    this.records = [...notifications];
    return ok(undefined);
  }
}
