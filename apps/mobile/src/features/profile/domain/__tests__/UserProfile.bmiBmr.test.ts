/**
 * RN-02 IMC y RN-03 TMB (`05-modelo-dominio-reglas.md` §2) y RF-01.05
 * (`features/profile/domain/UserProfile.ts`, tarea `F01-T03`, todavía no
 * implementada: esta prueba falla ahora mismo con "Cannot find module
 * '../UserProfile'", el estado rojo esperado).
 *
 * CA-01.05.1: perfil de 30 años, FEMALE, 165 cm y 60 kg -> IMC 22,0
 * categoría "Normal", TMB 1320 kcal/día (referencia del propio `spec.md`:
 * "10·60 + 6,25·165 − 5·30 − 161 = 1320,25 -> 1320").
 *
 * El aviso "Estimación, no es consejo médico" (Art. 5.1) es un texto de la
 * pantalla "Resumen" (`F01-T15`, bloqueada por `F02-T10`, ver plan.md §1):
 * no se prueba aquí (no hay componente todavía), se prueba junto con esa
 * pantalla cuando exista.
 */
import fc from "fast-check";
import { calculateBmi, calculateBmr, bmiCategory } from "../UserProfile";

describe("RF-01.05 UserProfile — RN-02 IMC", () => {
  describe("calculateBmi (RN-02: pesoKg / estaturaM², redondeado a 1 decimal)", () => {
    it("CA-01.05.1 con 60 kg y 165 cm, el IMC es 22,0", () => {
      expect(calculateBmi(60, 165)).toBeCloseTo(22.0, 1);
    });

    it("nunca es negativo ni cero para peso y estatura válidos (propiedad, RN-06-like: 25-350 kg, 100-250 cm)", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 25, max: 350, noNaN: true }),
          fc.float({ min: 100, max: 250, noNaN: true }),
          (weightKg, heightCm) => {
            expect(calculateBmi(weightKg, heightCm)).toBeGreaterThan(0);
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe("bmiCategory (RN-02: tabla OMS)", () => {
    it.each([
      [18.4, "UNDERWEIGHT"],
      [18.5, "NORMAL"],
      [22.0, "NORMAL"],
      [24.9, "NORMAL"],
      [25.0, "OVERWEIGHT"],
      [29.9, "OVERWEIGHT"],
      [30.0, "OBESITY"],
      [35.0, "OBESITY"],
    ])("CA-01.05.1 IMC=%s -> %s", (bmi, expectedCategory) => {
      expect(bmiCategory(bmi)).toBe(expectedCategory);
    });
  });
});

describe("RF-01.05 UserProfile — RN-03 TMB (Mifflin-St Jeor)", () => {
  describe("calculateBmr (RN-03: 10·pesoKg + 6,25·estaturaCm − 5·edad + s, redondeado a entero)", () => {
    it("CA-01.05.1 con 60 kg, 165 cm, 30 años, FEMALE, la TMB es 1320 kcal/día", () => {
      expect(calculateBmr({ weightKg: 60, heightCm: 165, age: 30, gender: "FEMALE" })).toBe(1320);
    });

    it.each([
      ["MALE", 5],
      ["FEMALE", -161],
      ["OTHER", -78],
      ["PREFER_NOT_TO_SAY", -78],
    ])(
      "constante de género (RN-03): %s aporta s=%i a la fórmula",
      (gender, s) => {
        const weightKg = 70;
        const heightCm = 175;
        const age = 25;
        const expected = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);

        expect(
          calculateBmr({
            weightKg,
            heightCm,
            age,
            gender: gender as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY",
          }),
        ).toBe(expected);
      },
    );

    it("nunca es negativa para las combinaciones de peso/estatura/edad válidas del rango de uso (16-100 años)", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 25, max: 350, noNaN: true }),
          fc.float({ min: 100, max: 250, noNaN: true }),
          fc.integer({ min: 16, max: 100 }),
          fc.constantFrom("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"),
          (weightKg, heightCm, age, gender) => {
            const bmr = calculateBmr({
              weightKg,
              heightCm,
              age,
              gender: gender as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY",
            });
            expect(bmr).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 200 },
      );
    });
  });
});
