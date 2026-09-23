/**
 * CA-01.03.2 Unidades (`specs/F01-perfil-onboarding/spec.md`: "...ingreso
 * 5 ft 9 in y 165 lb -> se almacenan 175,3 cm y 74,8 kg") y validación de
 * rango de peso de la tabla "Validaciones" (25-350 kg). El VO `Weight` en sí
 * ya está scaffoldeado en `shared/domain/Weight.ts` (H0); F01 añade aquí la
 * conversión lb<->kg y el rango propio de esta feature
 * (`specs/F01-perfil-onboarding/plan.md` §1, decisión de diseño).
 *
 * `features/profile/domain/BodyWeight.ts` (tarea `F01-T03`) todavía no
 * existe: esta prueba falla ahora mismo con "Cannot find module
 * '../BodyWeight'", el estado rojo esperado.
 */
import fc from "fast-check";
import { poundsToKg, kgToPounds, validateBodyWeightKg } from "../BodyWeight";
import { InvalidWeightError } from "../errors";
import { isErr, isOk } from "@/shared/domain/Result";

describe("RF-01.03 BodyWeight — conversión de unidades y validación (25-350 kg)", () => {
  describe("CA-01.03.2 conversión lb -> kg", () => {
    it("165 lb equivalen a 74,8 kg", () => {
      expect(poundsToKg(165)).toBeCloseTo(74.8, 1);
    });
  });

  describe("CA-01.03.2 conversión kg -> lb (se muestran siempre en unidades imperiales)", () => {
    it("74,8 kg equivalen aproximadamente a 165 lb", () => {
      expect(kgToPounds(74.8)).toBeCloseTo(165, 0);
    });
  });

  describe("validación de rango (tabla 'Validaciones' de spec.md: 25-350 kg)", () => {
    it.each([24.9, 0, -5, 350.1, 1000])(
      "rechaza %s kg (fuera de 25-350) con InvalidWeightError",
      (invalidKg) => {
        const result = validateBodyWeightKg(invalidKg);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(InvalidWeightError);
        }
      },
    );

    it.each([25, 74.8, 350])("acepta %s kg (dentro de 25-350)", (validKg) => {
      const result = validateBodyWeightKg(validKg);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(validKg);
      }
    });

    it("para cualquier valor dentro de 25-350 kg, siempre devuelve ok con el mismo valor (propiedad)", () => {
      fc.assert(
        fc.property(fc.float({ min: 25, max: 350, noNaN: true }), (kg) => {
          const result = validateBodyWeightKg(kg);
          expect(isOk(result)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });
  });
});
