/**
 * `UserProfile.fromPersistence` (añadido para `SqliteProfileRepository`,
 * `specs/F01-perfil-onboarding/plan.md` §4, tarea `F01-T09`): reconstruye un
 * perfil ya persistido sin repetir la validación de edad mínima de
 * `create()` (RN-01/CA-01.03.1 es una puerta de alta, no un invariante
 * permanente).
 */
import { UserProfile } from "../UserProfile";
import { asId } from "@/shared/domain/Id";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

describe("RF-01.03 UserProfile — fromPersistence", () => {
  it("reconstruye el perfil sin volver a validar la edad mínima (RN-01)", () => {
    const id = asId("00000000-0000-4000-b000-0000000000aa");
    const props = aUserProfileProps({ birthDate: new Date("1990-01-01T00:00:00Z") });

    const profile = UserProfile.fromPersistence(id, props);

    expect(profile.id).toBe(id);
    expect(profile.birthDate).toEqual(props.birthDate);
    expect(profile.accountId).toBeNull();
  });

  it("respeta un accountId ya vinculado", () => {
    const id = asId("00000000-0000-4000-b000-0000000000bb");
    const accountId = asId("00000000-0000-4000-b000-0000000000cc");
    const props = aUserProfileProps({ accountId });

    const profile = UserProfile.fromPersistence(id, props);

    expect(profile.accountId).toBe(accountId);
  });
});
