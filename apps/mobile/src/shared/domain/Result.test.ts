import { err, isErr, isOk, ok } from "./Result";

describe("Result", () => {
  it("ok() produce un resultado exitoso reconocido por isOk()", () => {
    const result = ok<number, string>(42);

    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) {
      expect(result.value).toBe(42);
    }
  });

  it("err() produce un resultado fallido reconocido por isErr()", () => {
    const result = err<string, number>("boom");

    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
    if (isErr(result)) {
      expect(result.error).toBe("boom");
    }
  });
});
