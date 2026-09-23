import { generateId, isId } from "./Id";
import type { Clock } from "./Clock";

function fixedClock(iso: string): Clock {
  return { now: () => new Date(iso) };
}

describe("generateId (H1: primer consumidor del generador basado en Clock)", () => {
  it("genera un Id con formato UUID válido", () => {
    const id = generateId(fixedClock("2026-09-22T10:00:00Z"));

    expect(isId(id)).toBe(true);
  });

  it("dos llamadas con el mismo reloj producen Ids distintos (no colisionan en el mismo proceso)", () => {
    const clock = fixedClock("2026-09-22T10:00:00Z");

    const first = generateId(clock);
    const second = generateId(clock);

    expect(first).not.toBe(second);
  });
});
