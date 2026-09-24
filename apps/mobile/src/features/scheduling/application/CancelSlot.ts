import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import type { SlotCancelledEvent } from "../domain/events";
import type { RepositoryError, ScheduleSlotRepository } from "./ports";

export interface CancelSlotDeps {
  scheduleSlotRepository: ScheduleSlotRepository;
  eventBus: EventBus;
  clock: Clock;
}

/**
 * `CancelSlot` (CA-04.01.2 "Cuando edito o elimino un ScheduleSlot ...
 * entonces todas las notificaciones futuras asociadas se cancelan y se
 * reprograman"; cierre de brecha H2-QA: `ScheduleSlot.cancel()` y el
 * reproductor `ReplanNotificationWindow` (suscrito a `SlotCancelled` en
 * `composition/container.ts`) ya existían, pero ningún caso de uso de
 * producción publicaba el evento — solo lo hacía `ScheduleSlotSyncEntityApplier`
 * al aplicar un `delete` remoto). Persiste el slot cancelado (borrado lógico,
 * RN-18, mismo repositorio que ya usa la sincronización) y publica
 * `SlotCancelled` para que la replanificación de notificaciones se dispare de
 * verdad desde una acción local del usuario, no solo desde `sync`.
 */
export class CancelSlot {
  constructor(private readonly deps: CancelSlotDeps) {}

  async execute(scheduleSlotId: Id): Promise<Result<void, RepositoryError>> {
    const { scheduleSlotRepository, eventBus, clock } = this.deps;

    const cancelResult = await scheduleSlotRepository.cancel(scheduleSlotId);
    if (isErr(cancelResult)) {
      return cancelResult;
    }

    const event: SlotCancelledEvent = {
      type: "SlotCancelled",
      occurredAt: clock.now(),
      scheduleSlotId,
    };
    await eventBus.publish(event);

    return ok(undefined);
  }
}
