/**
 * `InMemoryRestWarningStore` — RN-13 (CA-04.04.1/CA-04.04.2), soporte de
 * `CreateScheduleSlotsFromProposal.test.ts`.
 */
import { asId } from "@/shared/domain/Id";
import { InMemoryRestWarningStore } from "../InMemoryRestWarningStore";

describe("InMemoryRestWarningStore", () => {
  it("hace upsert por scheduleSlotId sin borrar las advertencias de otros slots", () => {
    const store = new InMemoryRestWarningStore();
    const slotA = asId("00000000-0000-4000-e200-00000000000a");
    const slotB = asId("00000000-0000-4000-e200-00000000000b");

    store.record([{ scheduleSlotId: slotA, warnings: [{ kind: "MIN_HOURS_BETWEEN_ROUTINES", hoursSinceLastSession: 5, minHoursRequired: 12 }] }]);
    store.record([{ scheduleSlotId: slotB, warnings: [{ kind: "MIN_HOURS_BETWEEN_ROUTINES", hoursSinceLastSession: 2, minHoursRequired: 12 }] }]);

    expect(store.listAll()).toHaveLength(2);
  });

  it("sobrescribe la entrada de un mismo scheduleSlotId", () => {
    const store = new InMemoryRestWarningStore();
    const slotA = asId("00000000-0000-4000-e200-00000000000a");

    store.record([{ scheduleSlotId: slotA, warnings: [{ kind: "MIN_HOURS_BETWEEN_ROUTINES", hoursSinceLastSession: 5, minHoursRequired: 12 }] }]);
    store.record([{ scheduleSlotId: slotA, warnings: [] }]);

    expect(store.listAll()).toEqual([{ scheduleSlotId: slotA, warnings: [] }]);
  });
});
