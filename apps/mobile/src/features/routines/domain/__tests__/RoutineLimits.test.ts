/**
 * RN-06 Límites de validación (`05-modelo-dominio-reglas.md` §2) — tabla de
 * casos por campo. Alimenta la validación "estricta" de `Routine.create`
 * (CA-03.01.2: "el botón Guardar está deshabilitado ... se indica qué
 * falta") y la validación "laxa" de `PreviewImportRoutine` (CA-03.08.3:
 * reps=500 se recorta a 100).
 *
 * Fase roja: `validateAgainstLimits`/`clampToLimits` (`F03-T05`) son
 * andamiaje mínimo que siempre acepta/nunca recorta — estas pruebas deben
 * fallar en la aserción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { ROUTINE_LIMITS, clampToLimits, validateAgainstLimits } from "../RoutineLimits";
import type { RoutineLimitField } from "../RoutineLimits";

describe("RN-06 ROUTINE_LIMITS — tabla de valores de referencia", () => {
  it("coincide exactamente con la tabla de 05-modelo-dominio-reglas.md §2", () => {
    expect(ROUTINE_LIMITS.sets).toEqual({ min: 1, max: 10, step: 1 });
    expect(ROUTINE_LIMITS.reps).toEqual({ min: 1, max: 100, step: 1 });
    expect(ROUTINE_LIMITS.workSeconds).toEqual({ min: 5, max: 600, step: 5 });
    expect(ROUTINE_LIMITS.restSeconds).toEqual({ min: 0, max: 600, step: 5 });
    expect(ROUTINE_LIMITS.prepSeconds).toEqual({ min: 0, max: 30, step: 1 });
    expect(ROUTINE_LIMITS.rounds).toEqual({ min: 1, max: 10, step: 1 });
    expect(ROUTINE_LIMITS.weightKg).toEqual({ min: 0, max: 500, step: 0.5 });
    expect(ROUTINE_LIMITS.itemsPerRoutine).toEqual({ min: 1, max: 40, step: 1 });
  });
});

describe("RN-06 validateAgainstLimits — CA-03.01.2 (modo estricto, rechaza fuera de rango)", () => {
  const belowMinCases: [RoutineLimitField, number][] = [
    ["sets", 0],
    ["reps", 0],
    ["workSeconds", 0],
    ["restSeconds", -5],
    ["prepSeconds", -1],
    ["rounds", 0],
    ["weightKg", -0.5],
    ["itemsPerRoutine", 0],
  ];

  it.each(belowMinCases)(
    "CA-03.01.2 rechaza %s = %d (por debajo del mínimo RN-06)",
    (field, value) => {
      const result = validateAgainstLimits(field, value);
      expect(isErr(result)).toBe(true);
    },
  );

  const aboveMaxCases: [RoutineLimitField, number][] = [
    ["sets", 11],
    ["reps", 101],
    ["workSeconds", 601],
    ["restSeconds", 601],
    ["prepSeconds", 31],
    ["rounds", 11],
    ["weightKg", 500.5],
    ["itemsPerRoutine", 41],
  ];

  it.each(aboveMaxCases)(
    "CA-03.01.2 rechaza %s = %d (por encima del máximo RN-06)",
    (field, value) => {
      const result = validateAgainstLimits(field, value);
      expect(isErr(result)).toBe(true);
    },
  );

  const withinRangeCases: [RoutineLimitField, number][] = [
    ["sets", 1],
    ["sets", 10],
    ["reps", 1],
    ["reps", 100],
    ["workSeconds", 5],
    ["workSeconds", 600],
    ["restSeconds", 0],
    ["restSeconds", 600],
    ["prepSeconds", 0],
    ["prepSeconds", 30],
    ["rounds", 1],
    ["rounds", 10],
    ["weightKg", 0],
    ["weightKg", 500],
    ["itemsPerRoutine", 1],
    ["itemsPerRoutine", 40],
  ];

  it.each(withinRangeCases)("acepta %s = %d (dentro del rango RN-06)", (field, value) => {
    const result = validateAgainstLimits(field, value);
    expect(isOk(result)).toBe(true);
  });
});

describe("RN-06 clampToLimits — CA-03.08.3 (modo laxo, recorta con advertencia)", () => {
  it("CA-03.08.3 recorta reps = 500 a 100 (máximo RN-06) y marca clamped=true", () => {
    const result = clampToLimits("reps", 500);
    expect(result).toEqual({ value: 100, clamped: true });
  });

  it("recorta sets = 15 a 10 (máximo RN-06) y marca clamped=true", () => {
    const result = clampToLimits("sets", 15);
    expect(result).toEqual({ value: 10, clamped: true });
  });

  it("recorta restSeconds = -10 a 0 (mínimo RN-06) y marca clamped=true", () => {
    const result = clampToLimits("restSeconds", -10);
    expect(result).toEqual({ value: 0, clamped: true });
  });

  it("no recorta un valor ya dentro de rango (clamped=false)", () => {
    const result = clampToLimits("reps", 12);
    expect(result).toEqual({ value: 12, clamped: false });
  });
});
