/**
 * RF-01.03/RF-01.06 `UpdateProfile`
 * (`features/profile/application/UpdateProfile.ts`, tarea `F01-T12`). Edita
 * objetivo/nivel/disponibilidad/estatura/equipo/peso objetivo: primero llama
 * al backend (`RemoteProfilePort.update`, `PUT /me/profile`) y solo si
 * acepta el cambio lo persiste localmente (`plan.md` §1 "Riesgos": el
 * servidor es autoritativo, mismo orden que `DeleteAccount`). Conserva los
 * campos que esta pantalla no edita (`birthDate`/`gender`/`unitSystem`/
 * `accountId`/`parqFlagged`/`healthConsentAt`).
 */
import { UpdateProfile } from "../UpdateProfile";
import { err, isErr, isOk, ok } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import type { ProfileRepository } from "@/features/profile/application/ports";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeRemoteProfilePort } from "@test/fakes/FakeRemoteProfilePort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

function buildExistingProfile(clock: FakeClock) {
  const created = UserProfile.create(
    asId("00000000-0000-4000-b000-000000000006"),
    aUserProfileProps({ accountId: asId("00000000-0000-4000-a000-000000000001") }),
    clock.now(),
  );
  if (!isOk(created)) {
    throw new Error("fixture inválida: UserProfile.create debería aceptar un perfil válido");
  }
  return created.value;
}

const VALID_COMMAND = {
  goal: "STRENGTH" as const,
  level: "INTERMEDIATE" as const,
  daysPerWeek: 4,
  minutesPerSession: 45,
  heightCm: 170,
  equipment: ["DUMBBELLS", "BENCH"] as const,
  targetWeightKg: 58,
};

describe("RF-01.03/RF-01.06 UpdateProfile", () => {
  it("actualiza el perfil en el servidor y localmente, conserva los campos no editables y emite ProfileUpdated", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const existing = buildExistingProfile(clock);
    const profileRepository = new FakeProfileRepository(existing);
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const useCase = new UpdateProfile({ profileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isOk(result)).toBe(true);
    expect(remoteProfilePort.updateCalls).toHaveLength(1);

    const saved = profileRepository.savedProfiles.at(-1);
    expect(saved?.goal).toBe("STRENGTH");
    expect(saved?.level).toBe("INTERMEDIATE");
    expect(saved?.daysPerWeek).toBe(4);
    expect(saved?.minutesPerSession).toBe(45);
    expect(saved?.heightCm).toBe(170);
    expect(saved?.equipment).toEqual(["DUMBBELLS", "BENCH"]);
    expect(saved?.targetWeightKg).toBe(58);
    // Campos no editados por esta pantalla: se conservan tal cual.
    expect(saved?.gender).toBe(existing.gender);
    expect(saved?.birthDate).toEqual(existing.birthDate);
    expect(saved?.unitSystem).toBe(existing.unitSystem);
    expect(saved?.accountId).toBe(existing.accountId);
    expect(saved?.parqFlagged).toBe(existing.parqFlagged);
    expect(saved?.healthConsentAt).toEqual(existing.healthConsentAt);

    expect(eventBus.eventsOfType("ProfileUpdated")).toHaveLength(1);
  });

  it("si el servidor rechaza el update (p. ej. token inválido/expirado), no persiste el cambio localmente", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const existing = buildExistingProfile(clock);
    const profileRepository = new FakeProfileRepository(existing);
    const remoteProfilePort = new FakeRemoteProfilePort();
    remoteProfilePort.updateResult = err({ code: "HTTP_401" });
    const eventBus = new FakeEventBus();
    const useCase = new UpdateProfile({ profileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isErr(result)).toBe(true);
    expect(profileRepository.savedProfiles).toHaveLength(0);
    expect(eventBus.eventsOfType("ProfileUpdated")).toHaveLength(0);
  });

  it("sin perfil local (usuario invitado que nunca completó el onboarding), no llama al backend", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const profileRepository = new FakeProfileRepository(null);
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const useCase = new UpdateProfile({ profileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toEqual({ kind: "NO_PROFILE" });
    }
    expect(remoteProfilePort.updateCalls).toHaveLength(0);
  });

  it("si falla la lectura del perfil local, propaga el RepositoryError sin llamar al backend", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const failingProfileRepository: ProfileRepository = {
      findCurrent: async () => err({ kind: "STORAGE_ERROR", message: "disco dañado" }),
      save: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new UpdateProfile({ profileRepository: failingProfileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isErr(result)).toBe(true);
    expect(remoteProfilePort.updateCalls).toHaveLength(0);
  });

  it("si falla el guardado local tras un update remoto exitoso, devuelve el RepositoryError (el cambio ya quedó aceptado en el servidor)", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const existing = buildExistingProfile(clock);
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const failingProfileRepository: ProfileRepository = {
      findCurrent: async () => ok(existing),
      save: async () => err({ kind: "STORAGE_ERROR", message: "disco lleno" }),
      clear: async () => ok(undefined),
    };
    const useCase = new UpdateProfile({ profileRepository: failingProfileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isErr(result)).toBe(true);
    expect(remoteProfilePort.updateCalls).toHaveLength(1);
    expect(eventBus.eventsOfType("ProfileUpdated")).toHaveLength(0);
  });

  it("RN-01: si el perfil local existente (leído de una fuente que no valida, p. ej. datos legacy) ya no cumple la edad mínima, UpdateProfile lo rechaza sin llamar al backend", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    // `fromPersistence` (a diferencia de `create`) no valida RN-01: se usa
    // aquí a propósito para simular un perfil legacy con una fecha de
    // nacimiento que hoy implicaría menos de 16 años, y así ejercitar la
    // rama de error de `UserProfile.create` dentro de `UpdateProfile`
    // (en la práctica inalcanzable con datos creados por la propia app,
    // ya que la edad solo aumenta con el tiempo).
    const underageProfile = UserProfile.fromPersistence(
      asId("00000000-0000-4000-b000-000000000009"),
      aUserProfileProps({ birthDate: new Date("2020-01-01T00:00:00Z") }),
    );
    const profileRepository = new FakeProfileRepository(underageProfile);
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const useCase = new UpdateProfile({ profileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect("code" in result.error && result.error.code).toBe("AGE_BELOW_MINIMUM");
    }
    expect(remoteProfilePort.updateCalls).toHaveLength(0);
  });

  it("preserva el id del perfil (no crea uno nuevo al editar)", async () => {
    const clock = new FakeClock("2026-09-23T10:00:00Z");
    const existing = buildExistingProfile(clock);
    const profileRepository = new FakeProfileRepository(existing);
    const remoteProfilePort = new FakeRemoteProfilePort();
    const eventBus = new FakeEventBus();
    const useCase = new UpdateProfile({ profileRepository, remoteProfilePort, eventBus, clock });

    const result = await useCase.execute({ ...VALID_COMMAND, equipment: [...VALID_COMMAND.equipment] });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.profile.id).toBe(existing.id);
    }
    expect(remoteProfilePort.updateCalls[0]?.id).toBe(existing.id);
  });
});
