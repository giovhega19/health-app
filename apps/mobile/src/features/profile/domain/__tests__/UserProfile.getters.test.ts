/**
 * Prueba unitaria añadida por `dev-mobile-rn` (no de QA) para cubrir getters
 * de `UserProfile` (`birthDate`, `gender`, `unitSystem`, `targetWeightKg`,
 * `healthConsentAt`) y `ageAt(today)` que ninguna prueba de QA ejercita
 * directamente. Requerida para cumplir el umbral de cobertura de dominio
 * (Art. 3.2: ≥ 90 %).
 */
import { UserProfile } from "../UserProfile";
import { asId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

describe("UserProfile — getters adicionales", () => {
  it("expone birthDate, gender, unitSystem, targetWeightKg, healthConsentAt y calcula ageAt()", () => {
    const birthDate = new Date("1996-01-15T00:00:00Z");
    const healthConsentAt = new Date("2026-09-22T10:00:00Z");
    const props = aUserProfileProps({
      birthDate,
      gender: "MALE",
      unitSystem: "IMPERIAL",
      targetWeightKg: 65,
      healthConsentAt,
    });

    const result = UserProfile.create(
      asId("00000000-0000-4000-b000-0000000000ff"),
      props,
      new Date("2026-09-22T10:00:00Z"),
    );

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const profile = result.value;

    expect(profile.birthDate).toEqual(birthDate);
    expect(profile.gender).toBe("MALE");
    expect(profile.unitSystem).toBe("IMPERIAL");
    expect(profile.targetWeightKg).toBe(65);
    expect(profile.healthConsentAt).toEqual(healthConsentAt);
    expect(profile.ageAt(new Date("2027-09-22T10:00:00Z"))).toBe(31);
  });
});
