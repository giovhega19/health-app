/**
 * RN-01 Edad (`05-modelo-dominio-reglas.md` §2: "edad = años completos entre
 * birthDate y hoy. Edad mínima de uso: 16 años (D2)") y RF-01.03
 * (`features/profile/domain/UserProfile.ts`, tarea `F01-T03`, todavía no
 * implementada: esta prueba falla ahora mismo con "Cannot find module
 * '../UserProfile'", el estado rojo esperado).
 *
 * CA-01.03.1: una fecha de nacimiento que da una edad menor a 16 años
 * bloquea el avance con un mensaje amable ("no puedo avanzar").
 */
import fc from "fast-check";
import { calculateAge, UserProfile } from "../UserProfile";
import { AgeBelowMinimumError } from "../errors";
import { asId } from "@/shared/domain/Id";
import { isErr, isOk } from "@/shared/domain/Result";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

const PROFILE_ID = asId("00000000-0000-4000-b000-000000000001");

describe("RF-01.03 UserProfile — RN-01 edad", () => {
  describe("calculateAge (RN-01: años completos entre birthDate y hoy)", () => {
    it.each([
      ["cumpleaños ya pasado este año", "2010-03-15", "2026-09-22", 16],
      ["cumpleaños es hoy", "2010-09-22", "2026-09-22", 16],
      ["cumpleaños todavía no llega este año", "2010-09-23", "2026-09-22", 15],
      ["recién nacido (mismo día)", "2026-09-22", "2026-09-22", 0],
      ["un año exacto", "2025-09-22", "2026-09-22", 1],
    ])("%s: nace %s, hoy %s -> %i años", (_description, birthDateIso, todayIso, expectedAge) => {
      expect(calculateAge(new Date(birthDateIso), new Date(todayIso))).toBe(expectedAge);
    });

    it("nunca es negativa y nunca decrece a medida que pasa el tiempo (propiedad)", () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date("1930-01-01T00:00:00Z"),
            max: new Date("2026-09-22T00:00:00Z"),
            noInvalidDate: true,
          }),
          fc.integer({ min: 0, max: 365 * 5 }),
          (birthDate, daysLater) => {
            const today = new Date("2026-09-22T00:00:00Z");
            const laterToday = new Date(today.getTime() + daysLater * 86_400_000);

            const age = calculateAge(birthDate, today);
            const laterAge = calculateAge(birthDate, laterToday);

            expect(age).toBeGreaterThanOrEqual(0);
            expect(laterAge).toBeGreaterThanOrEqual(age);
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe("UserProfile.create (RN-01: mínimo 16 años, decisión D2)", () => {
    it("CA-01.03.1 con una edad menor a 16 años, rechaza la creación con AgeBelowMinimumError y no permite avanzar", () => {
      const today = new Date("2026-09-22T10:00:00Z");
      // 2011-01-01 -> 15 años el 2026-09-22.
      const props = aUserProfileProps({ birthDate: new Date("2011-01-01T00:00:00Z") });

      const result = UserProfile.create(PROFILE_ID, props, today);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(AgeBelowMinimumError);
        expect(result.error.code).toBe("AGE_BELOW_MINIMUM");
      }
    });

    it("CA-01.03.1 con 15 años y 364 días (un día antes de cumplir el mínimo), rechaza la creación", () => {
      const today = new Date("2026-09-22T10:00:00Z");
      const props = aUserProfileProps({ birthDate: new Date("2010-09-23T00:00:00Z") });

      const result = UserProfile.create(PROFILE_ID, props, today);

      expect(isErr(result)).toBe(true);
    });

    it("con exactamente 16 años (el mínimo, D2), permite crear el perfil", () => {
      const today = new Date("2026-09-22T10:00:00Z");
      const props = aUserProfileProps({ birthDate: new Date("2010-09-22T00:00:00Z") });

      const result = UserProfile.create(PROFILE_ID, props, today);

      expect(isOk(result)).toBe(true);
    });
  });
});
