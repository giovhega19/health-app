import type { Id } from "@/shared/domain/Id";
import type { RestWarningStore, ScheduleSlotRestWarnings } from "../application/ports";

/**
 * `InMemoryRestWarningStore` (RN-13, CA-04.04.1/CA-04.04.2, cierre de
 * brecha H2-QA): adaptador en memoria — un `Map` por proceso, mismo patrón
 * que `InMemoryEventBus` (`shared/infrastructure/event-bus`). No persiste en
 * SQLite a propósito (`application/ports.ts`, ver el comentario de
 * `RestWarningStore`): la advertencia solo necesita sobrevivir mientras la
 * app está abierta después de aceptar una propuesta.
 */
export class InMemoryRestWarningStore implements RestWarningStore {
  private readonly byScheduleSlotId = new Map<Id, ScheduleSlotRestWarnings>();

  record(entries: ScheduleSlotRestWarnings[]): void {
    for (const entry of entries) {
      this.byScheduleSlotId.set(entry.scheduleSlotId, entry);
    }
  }

  listAll(): ScheduleSlotRestWarnings[] {
    return [...this.byScheduleSlotId.values()];
  }
}
