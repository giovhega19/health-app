import type { Id } from "@/shared/domain/Id";
import type { RestWarningStore, ScheduleSlotRestWarnings } from "@/features/scheduling/application/ports";

/**
 * Fake en memoria de `RestWarningStore` (`features/scheduling/application/ports.ts`,
 * RN-13/CA-04.04.1/CA-04.04.2). Mismo comportamiento que el adaptador real
 * `InMemoryRestWarningStore` (upsert por `scheduleSlotId`), pero vive en
 * `test/fakes` para que las pruebas de `application/` puedan inyectarlo sin
 * violar `application-no-ui-or-infrastructure` (`.dependency-cruiser.js`):
 * "los casos de uso solo dependen de domain, no de infraestructura concreta,
 * ni siquiera en sus propias pruebas" — "fakes antes que mocks para los
 * puertos de repositorio" (07-estrategia-pruebas.md §2.4).
 */
export class FakeRestWarningStore implements RestWarningStore {
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
