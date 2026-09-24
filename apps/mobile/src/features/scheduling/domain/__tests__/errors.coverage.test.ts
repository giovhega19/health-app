/**
 * `scheduling/domain/errors.ts` — cobertura del mensaje por defecto de
 * `PostponeLimitReachedError` (declarada por QA como parte del vocabulario
 * de errores del dominio; no construida hoy por ningún caso de uso, que usa
 * en su lugar el `Result` con `{ kind: "POSTPONE_LIMIT_REACHED" }` — se
 * mantiene aquí como parte del vocabulario de errores de dominio, RN-13/
 * CA-04.05.1, Art. 3.2).
 */
import { PostponeLimitReachedError } from "../errors";

describe("PostponeLimitReachedError", () => {
  it("tiene un mensaje y código por defecto", () => {
    const error = new PostponeLimitReachedError();
    expect(error.code).toBe("POSTPONE_LIMIT_REACHED");
    expect(error.name).toBe("PostponeLimitReachedError");
    expect(error.message).toContain("3 veces");
  });
});
