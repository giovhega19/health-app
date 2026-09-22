import { Weight } from "./Weight";

describe("Weight", () => {
  it("crea un peso con un valor y una unidad válidos", () => {
    const weight = Weight.of(72.5, "KG");

    expect(weight.toValue()).toBe(72.5);
    expect(weight.toUnit()).toBe("KG");
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rechaza valores inválidos (%p)",
    (value: number) => {
      expect(() => Weight.of(value, "KG")).toThrow();
    },
  );

  it("dos pesos con el mismo valor y unidad son iguales", () => {
    expect(Weight.of(80, "KG").equals(Weight.of(80, "KG"))).toBe(true);
  });

  it("dos pesos con distinta unidad no son iguales", () => {
    expect(Weight.of(80, "KG").equals(Weight.of(80, "LB"))).toBe(false);
  });
});
