import { assert, nat, property } from "fast-check";

import { Duration } from "./Duration";

describe("Duration", () => {
  it("crea una duración a partir de segundos válidos", () => {
    const duration = Duration.fromSeconds(90);

    expect(duration.toSeconds()).toBe(90);
  });

  it.each([-1, 1.5, Number.NaN])("rechaza segundos inválidos (%p)", (seconds) => {
    expect(() => Duration.fromSeconds(seconds)).toThrow();
  });

  it("dos duraciones con los mismos segundos son iguales", () => {
    expect(Duration.fromSeconds(60).equals(Duration.fromSeconds(60))).toBe(true);
  });

  it("dos duraciones con distintos segundos no son iguales", () => {
    expect(Duration.fromSeconds(60).equals(Duration.fromSeconds(61))).toBe(false);
  });

  it("[fast-check] toSeconds() es la inversa de fromSeconds() para cualquier entero >= 0", () => {
    assert(
      property(nat(), (seconds: number) => {
        expect(Duration.fromSeconds(seconds).toSeconds()).toBe(seconds);
      }),
    );
  });
});
