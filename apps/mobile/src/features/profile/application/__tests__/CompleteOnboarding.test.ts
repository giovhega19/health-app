/**
 * RF-01.02 `CompleteOnboarding` (`features/profile/application/CompleteOnboarding.ts`,
 * tarea `F01-T11`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../CompleteOnboarding'", el estado rojo
 * esperado).
 *
 * CA-01.02.1: al completar todos los pasos del asistente y elegir
 * "Continuar como invitado" (en H1, `ContinueAsGuest` solo confirma un modo
 * ya guest desde el principio: `CompleteOnboarding` es quien de verdad crea
 * el perfil local sin cuenta y obtiene el plan semanal propuesto vía
 * `RoutineProposalPort`, ver `plan.md` §1/§3). Nivel elegido: aplicación (el
 * nivel más bajo que verifica "se crea un perfil local sin cuenta en el
 * servidor" + "veo mi plan semanal propuesto", 07-estrategia-pruebas.md §1).
 *
 * CA-01.03.1 y CA-01.07.1 se prueban aquí también a nivel de aplicación
 * (que el caso de uso propague el error de dominio / no persista sin
 * consentimiento), complementando las pruebas de dominio
 * (`UserProfile.age.test.ts`) y de componente (`Consent.test.tsx`).
 */
import { CompleteOnboarding } from "../CompleteOnboarding";
import { isErr, isOk } from "@/shared/domain/Result";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeRoutineProposalPort } from "@test/fakes/FakeRoutineProposalPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aCompleteOnboardingCommand } from "@test/fakes/aCompleteOnboardingCommand";

function buildUseCase() {
  const profileRepository = new FakeProfileRepository();
  const bodyMetricRepository = new FakeBodyMetricRepository();
  const routineProposalPort = new FakeRoutineProposalPort();
  const eventBus = new FakeEventBus();
  const clock = new FakeClock("2026-09-22T10:00:00Z");
  const useCase = new CompleteOnboarding({
    profileRepository,
    bodyMetricRepository,
    routineProposalPort,
    eventBus,
    clock,
  });
  return { useCase, profileRepository, bodyMetricRepository, routineProposalPort, eventBus, clock };
}

describe("RF-01.02 CompleteOnboarding", () => {
  it("CA-01.02.1 completo en modo invitado: crea un perfil local sin cuenta en el servidor y devuelve el plan semanal propuesto", async () => {
    const { useCase, profileRepository, routineProposalPort } = buildUseCase();
    const command = aCompleteOnboardingCommand();

    const result = await useCase.execute(command);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    // Perfil local guardado (sin llamar a ningún AuthPort: CompleteOnboarding
    // no depende de identity, ver plan.md §2 "Application").
    expect(profileRepository.savedProfiles).toHaveLength(1);
    // Plan semanal propuesto, obtenido vía RoutineProposalPort (F02).
    expect(routineProposalPort.calls).toHaveLength(1);
    expect(result.value.profile).toBeDefined();
    expect(result.value.proposal).toBeDefined();
  });

  it("CA-01.02.1 publica OnboardingCompleted con mode GUEST cuando el onboarding se completa sin cuenta", async () => {
    const { useCase, eventBus } = buildUseCase();

    await useCase.execute(aCompleteOnboardingCommand());

    const events = eventBus.eventsOfType("OnboardingCompleted");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { mode: string }).mode).toBe("GUEST");
  });

  it("CA-01.03.1 con una edad menor a 16 años, no persiste el perfil ni llama al motor de propuesta", async () => {
    const { useCase, profileRepository, routineProposalPort } = buildUseCase();
    const command = aCompleteOnboardingCommand({
      birthDate: new Date("2011-01-01T00:00:00Z"), // 15 años el 2026-09-22
    });

    const result = await useCase.execute(command);

    expect(isErr(result)).toBe(true);
    expect(profileRepository.savedProfiles).toHaveLength(0);
    expect(routineProposalPort.calls).toHaveLength(0);
  });

  it("CA-01.07.1 sin consentimiento de datos de salud, no persiste el perfil (Art. 5.3)", async () => {
    const { useCase, profileRepository } = buildUseCase();
    const command = aCompleteOnboardingCommand({ healthDataConsent: false });

    const result = await useCase.execute(command);

    expect(isErr(result)).toBe(true);
    expect(profileRepository.savedProfiles).toHaveLength(0);
  });
});
