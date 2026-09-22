import { asId, isId } from "./Id";

describe("Id", () => {
  const validUuid = "018f1e0a-6d3a-7b3e-8a2e-6d6f7d4e2b3a";

  it("isId() acepta un UUID bien formado", () => {
    expect(isId(validUuid)).toBe(true);
  });

  it("isId() rechaza un string mal formado", () => {
    expect(isId("no-es-un-uuid")).toBe(false);
  });

  it("asId() devuelve el valor cuando es válido", () => {
    expect(asId(validUuid)).toBe(validUuid);
  });

  it("asId() lanza un error cuando el valor no es válido", () => {
    expect(() => asId("no-es-un-uuid")).toThrow();
  });
});
