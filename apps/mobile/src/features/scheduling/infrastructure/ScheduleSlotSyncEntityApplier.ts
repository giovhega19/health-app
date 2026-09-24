import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { RemoteChange, RepositoryError, SyncEntityApplier } from "@/features/sync";
import { ScheduleSlot } from "../domain/ScheduleSlot";
import type { DayOfWeek } from "../domain/ScheduleSlot";
import type { ScheduleSlotRepository } from "../application/ports";

/**
 * `ScheduleSlotSyncEntityApplier` (mismo SPI `SyncEntityApplier` que
 * `ProfileSyncEntityApplier`/F03 `RoutineSyncEntityApplier`,
 * `specs/F04-programacion-recordatorios/plan.md` §3: "sí se sincroniza
 * `ScheduleSlot`", `packages/api-contract/openapi.yaml` `SyncEntity` ya
 * amplía el enum con `scheduleSlot`). Lado *pull*: aplica un `RemoteChange`
 * de `entity: "scheduleSlot"` recibido por `GET /sync/pull` al
 * almacenamiento local (LWW por `updatedAt`, RN-18).
 *
 */
export class ScheduleSlotSyncEntityApplier implements SyncEntityApplier {
  constructor(private readonly scheduleSlotRepository: ScheduleSlotRepository) {}

  supports(entity: string): boolean {
    return entity === "scheduleSlot";
  }

  async apply(change: RemoteChange): Promise<Result<void, RepositoryError>> {
    if (change.op === "delete") {
      return this.scheduleSlotRepository.cancel(asId(change.id));
    }
    if (!change.data) {
      return ok(undefined);
    }

    const data = change.data;
    // Datos ya validados en el dispositivo de origen (RN-18, LWW): se
    // reconstruye con `fromPersistence` (sin re-validar) para no rechazar un
    // cambio remoto legítimo por invariantes que ya se cumplieron allí.
    const slot = ScheduleSlot.fromPersistence(asId(data.id as string), {
      routineId: asId(data.routineId as string),
      daysOfWeek: data.daysOfWeek as DayOfWeek[],
      startTime: data.startTime as string,
      reminderOffsetMin: data.reminderOffsetMin as number,
      active: data.active as boolean,
      updatedAt: new Date(change.updatedAt),
      deletedAt: data.deletedAt ? new Date(data.deletedAt as string) : null,
    });

    return this.scheduleSlotRepository.save(slot);
  }
}
