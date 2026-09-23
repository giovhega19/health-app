import { SystemClock } from "../SystemClock";

describe("SystemClock", () => {
  it("now() devuelve la hora real del sistema (Date)", () => {
    const clock = new SystemClock();
    const before = Date.now();

    const now = clock.now();

    const after = Date.now();
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });
});
