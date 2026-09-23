/**
 * RF-01.02 `ContinueAsGuest` (`features/profile/application/ContinueAsGuest.ts`,
 * tarea `F01-T12`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../ContinueAsGuest'", el estado rojo esperado).
 *
 * CA-01.02.1: al elegir "Continuar como invitado" en la pantalla de Resumen
 * (después de `CompleteOnboarding`, que ya creó el perfil local, ver
 * `CompleteOnboarding.test.ts`), la app confirma el modo invitado sin tocar
 * ningún `AuthPort` ("se crea un perfil local sin cuenta en el servidor") y
 * navega a inicio con el perfil ya guardado.
 */
import { ContinueAsGuest } from "../ContinueAsGuest";
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

describe("RF-01.02 ContinueAsGuest", () => {
  it("CA-01.02.1 confirma el modo invitado sin llamar a ningún puerto de autenticación", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const profileRepository = new FakeProfileRepository();
    const created = UserProfile.create(
      asId("00000000-0000-4000-b000-000000000003"),
      aUserProfileProps(),
      clock.now(),
    );
    if (isOk(created)) {
      profileRepository.current = created.value;
    }
    const eventBus = new FakeEventBus();
    const useCase = new ContinueAsGuest({ profileRepository, eventBus, clock });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.profile).toBeDefined();
  });

  it("CA-01.02.1 publica OnboardingCompleted con mode GUEST", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const profileRepository = new FakeProfileRepository();
    const created = UserProfile.create(
      asId("00000000-0000-4000-b000-000000000004"),
      aUserProfileProps(),
      clock.now(),
    );
    if (isOk(created)) {
      profileRepository.current = created.value;
    }
    const eventBus = new FakeEventBus();
    const useCase = new ContinueAsGuest({ profileRepository, eventBus, clock });

    await useCase.execute();

    const events = eventBus.eventsOfType("OnboardingCompleted");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { mode: string }).mode).toBe("GUEST");
  });
});
