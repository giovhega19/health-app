/**
 * `ScheduleSlot` — pruebas de cobertura (Art. 3.2: capa `domain` ≥ 90 %).
 * QA no dejó un `ScheduleSlot.test.ts` propio (el agregado se ejercita solo
 * indirectamente vía el fixture `aScheduleSlot()` en otras suites); estas
 * pruebas cubren directamente sus invariantes (CA-04.01.1), `cancel()`,
 * `withSchedule()` y `fromPersistence()`.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ScheduleSlot } from "../ScheduleSlot";
import type { DayOfWeek } from "../ScheduleSlot";

const ROUTINE_ID = asId("00000000-0000-4000-e100-000000000001");
const SLOT_ID = asId("00000000-0000-4000-e200-000000000099");
const NOW = new Date("2026-09-21T08:00:00Z");

function validInput(overrides: Partial<Parameters<typeof ScheduleSlot.create>[0]> = {}) {
  return {
    id: SLOT_ID,
    routineId: ROUTINE_ID,
    daysOfWeek: [1] as DayOfWeek[],
    startTime: "18:00",
    reminderOffsetMin: 15,
    now: NOW,
    ...overrides,
  };
}

describe("ScheduleSlot.create — CA-04.01.1 invariantes", () => {
  it("crea un slot activo con los días de la semana ordenados y sin duplicados", () => {
    const result = ScheduleSlot.create(validInput({ daysOfWeek: [4, 1, 4] }));

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.daysOfWeek).toEqual([1, 4]);
    expect(result.value.active).toBe(true);
    expect(result.value.routineId).toBe(ROUTINE_ID);
    expect(result.value.startTime).toBe("18:00");
    expect(result.value.reminderOffsetMin).toBe(15);
    expect(result.value.updatedAt).toEqual(NOW);
    expect(result.value.deletedAt).toBeNull();
  });

  it("rechaza un slot sin ningún día de la semana seleccionado", () => {
    const result = ScheduleSlot.create(validInput({ daysOfWeek: [] }));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.name).toBe("NoDaysSelectedError");
    }
  });

  it("rechaza una hora de inicio con formato inválido", () => {
    const result = ScheduleSlot.create(validInput({ startTime: "25:99" }));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.name).toBe("InvalidStartTimeError");
    }
  });

  it("rechaza un reminderOffsetMin negativo", () => {
    const result = ScheduleSlot.create(validInput({ reminderOffsetMin: -1 }));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.name).toBe("InvalidReminderOffsetError");
    }
  });
});

describe("ScheduleSlot.cancel / withSchedule / fromPersistence", () => {
  it("cancel() desactiva el slot y marca deletedAt (borrado lógico, CA-04.01.2)", () => {
    const created = ScheduleSlot.create(validInput());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const cancelledAt = new Date("2026-09-22T00:00:00Z");
    const cancelled = created.value.cancel(cancelledAt);

    expect(cancelled.active).toBe(false);
    expect(cancelled.deletedAt).toEqual(cancelledAt);
    expect(cancelled.updatedAt).toEqual(cancelledAt);
  });

  it("withSchedule() devuelve una nueva instancia válida con el horario editado", () => {
    const created = ScheduleSlot.create(validInput());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const editedAt = new Date("2026-09-22T00:00:00Z");
    const edited = created.value.withSchedule([2, 5], "19:30", 20, editedAt);

    expect(isOk(edited)).toBe(true);
    if (!isOk(edited)) return;
    expect(edited.value.daysOfWeek).toEqual([2, 5]);
    expect(edited.value.startTime).toBe("19:30");
    expect(edited.value.reminderOffsetMin).toBe(20);
  });

  it("withSchedule() propaga el error de validación si el nuevo horario es inválido", () => {
    const created = ScheduleSlot.create(validInput());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const edited = created.value.withSchedule([], "19:30", 20, NOW);

    expect(isErr(edited)).toBe(true);
  });

  it("fromPersistence() reconstruye un slot sin re-validar", () => {
    const slot = ScheduleSlot.fromPersistence(SLOT_ID, {
      routineId: ROUTINE_ID,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
      active: true,
      updatedAt: NOW,
      deletedAt: null,
    });

    expect(slot.id).toBe(SLOT_ID);
    expect(slot.active).toBe(true);
  });
});
