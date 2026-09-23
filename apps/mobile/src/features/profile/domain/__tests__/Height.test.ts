/**
 * CA-01.03.2 Unidades (`specs/F01-perfil-onboarding/spec.md`: "elijo el
 * sistema imperial... ingreso 5 ft 9 in y 165 lb -> se almacenan 175,3 cm y
 * 74,8 kg... y se muestran siempre en unidades imperiales") y validación de
 * rango de estatura de la tabla "Validaciones" (100-250 cm).
 *
 * `features/profile/domain/Height.ts` (tarea `F01-T03`) todavía no existe:
 * esta prueba falla ahora mismo con "Cannot find module '../Height'", el
 * estado rojo esperado.
 */
import { Height } from "../Height";
import { InvalidHeightError } from "../errors";

describe("RF-01.03 Height — conversión de unidades y validación (100-250 cm)", () => {
  describe("CA-01.03.2 conversión ft/in -> cm", () => {
    it("5 ft 9 in equivalen a 175,3 cm", () => {
      const height = Height.fromFeetInches(5, 9);

      expect(height.toCm()).toBeCloseTo(175.3, 1);
    });

    it("Height.fromCm(175.3).toCm() conserva el valor", () => {
      expect(Height.fromCm(175.3).toCm()).toBeCloseTo(175.3, 1);
    });
  });

  describe("CA-01.03.2 conversión cm -> ft/in (se muestran siempre en unidades imperiales)", () => {
    it("180 cm equivalen aproximadamente a 5 ft 11 in", () => {
      const { feet, inches } = Height.fromCm(180).toFeetInches();

      expect(feet).toBe(5);
      expect(inches).toBe(11);
    });

    // Prueba unitaria añadida por `dev-mobile-rn` (no de QA): cubre el caso
    // límite en el que el redondeo de pulgadas produce 12 (debe acarrear al
    // siguiente pie), requerido para el umbral de cobertura de dominio
    // (Art. 3.2: ≥ 90 %).
    it("181,864 cm (71,6 in) redondea a 6 ft 0 in, no a 5 ft 12 in", () => {
      const { feet, inches } = Height.fromCm(181.864).toFeetInches();

      expect(feet).toBe(6);
      expect(inches).toBe(0);
    });
  });

  describe("validación de rango (tabla 'Validaciones' de spec.md: 100-250 cm)", () => {
    it.each([99.9, 0, -10, 250.1, 400])(
      "rechaza %s cm (fuera de 100-250) con InvalidHeightError",
      (invalidCm) => {
        expect(() => Height.fromCm(invalidCm)).toThrow(InvalidHeightError);
      },
    );

    it.each([100, 165, 250])("acepta %s cm (dentro de 100-250)", (validCm) => {
      expect(() => Height.fromCm(validCm)).not.toThrow();
    });
  });
});
