/**
 * RF-01.01 `CreateAccount` (`features/profile/application/CreateAccount.ts`,
 * tarea `F01-T12`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../CreateAccount'", el estado rojo esperado).
 *
 * CA-01.01.1 Pasar de invitado a cuenta sin perder datos: "uso la app como
 * invitado... creo una cuenta con email y contraseña -> mis... rutinas y
 * perfil se sincronizan con la cuenta nueva". Alcance H1 (ver
 * `specs/F01-perfil-onboarding/plan.md` §5, nota): en H1 no existen
 * sesiones/rutinas de usuario todavía (F03/F05 son de hitos futuros), así
 * que esta prueba cubre la parte verificable en H1: el perfil local
 * existente se conserva íntegro y se vincula a la cuenta nueva (no se
 * recrea desde cero), y los tokens de la sesión se guardan. La replicación
 * hacia el backend vía `/sync/push` se prueba en `features/sync` (fuera del
 * alcance de este archivo, que se limita a `features/profile/application`
 * según el encargo de este agente).
 */
import { CreateAccount } from "../CreateAccount";
import { err, isErr, isOk, ok } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

function buildExistingGuestProfile(clock: FakeClock) {
  const created = UserProfile.create(
    asId("00000000-0000-4000-b000-000000000005"),
    aUserProfileProps({ goal: "MUSCLE_GAIN", heightCm: 180 }),
    clock.now(),
  );
  if (!isOk(created)) {
    throw new Error("fixture inválida: UserProfile.create debería aceptar un perfil válido");
  }
  return created.value;
}

describe("RF-01.01 CreateAccount — pasar de invitado a cuenta (CA-01.01.1)", () => {
  it("CA-01.01.1 crea la cuenta, guarda los tokens y conserva los datos del perfil local (solo lo vincula a la cuenta nueva)", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const existingProfile = buildExistingGuestProfile(clock);
    const profileRepository = new FakeProfileRepository(existingProfile);
    const authPort = new FakeAuthPort();
    const sessionUserId = asId("00000000-0000-4000-a000-000000000042");
    authPort.guestUpgradeResult = ok({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: sessionUserId, email: "ana@fitapp.test" },
    });
    const tokenStoragePort = new FakeTokenStoragePort();
    const eventBus = new FakeEventBus();
    const useCase = new CreateAccount({ authPort, profileRepository, tokenStoragePort, eventBus, clock });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isOk(result)).toBe(true);
    expect(authPort.guestUpgradeCalls).toHaveLength(1);
    expect(tokenStoragePort.saveCalls).toHaveLength(1);

    const savedProfile = profileRepository.savedProfiles.at(-1);
    expect(savedProfile).toBeDefined();
    // Los datos del perfil (recogidos durante el onboarding) no se pierden.
    expect(savedProfile?.goal).toBe(existingProfile.goal);
    expect(savedProfile?.heightCm).toBe(existingProfile.heightCm);
    expect(savedProfile?.parqFlagged).toBe(existingProfile.parqFlagged);
    // Y quedan vinculados a la cuenta recién creada.
    expect(savedProfile?.accountId).toBe(sessionUserId);
  });

  it("con un email ya registrado, no toca el perfil local ni guarda tokens (se ofrece iniciar sesión, ver 'Estados de UI' de spec.md)", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const existingProfile = buildExistingGuestProfile(clock);
    const profileRepository = new FakeProfileRepository(existingProfile);
    const authPort = new FakeAuthPort();
    authPort.guestUpgradeResult = err({ code: "EMAIL_ALREADY_REGISTERED" });
    const tokenStoragePort = new FakeTokenStoragePort();
    const eventBus = new FakeEventBus();
    const useCase = new CreateAccount({ authPort, profileRepository, tokenStoragePort, eventBus, clock });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isErr(result)).toBe(true);
    expect(profileRepository.savedProfiles).toHaveLength(0);
    expect(tokenStoragePort.saveCalls).toHaveLength(0);
  });
});
