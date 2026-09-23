/**
 * RN-14 Motor de propuesta de rutinas (`05-modelo-dominio-reglas.md` §2:
 * "Si el cuestionario de aptitud salió positivo, solo se proponen rutinas
 * BEGINNER y GENERAL_HEALTH hasta que el usuario confirme autorización
 * médica") y RF-01.04 (`features/profile/application/CompleteOnboarding.ts`,
 * tarea `F01-T11`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../CompleteOnboarding'", el estado rojo
 * esperado).
 *
 * CA-01.04.1: al responder "sí" a alguna pregunta del cuestionario de
 * aptitud, el `ProfileSnapshot` que se pasa al motor de propuesta (F02, vía
 * `RoutineProposalPort`) debe llevar `parqFlagged: true`, y el propio
 * `UserProfile` persistido conserva ese flag (para que RN-14 lo siga
 * respetando en propuestas futuras, no solo en el onboarding). La regla
 * RN-14 en sí (solo BEGINNER/GENERAL_HEALTH) se prueba en
 * `features/catalog/domain/__tests__/RecommendationEngine.rn14.test.ts`
 * (F02); aquí solo se verifica el límite de F01: que el flag se calcule y se
 * propague correctamente.
 */
import { CompleteOnboarding } from "../CompleteOnboarding";
import { isOk } from "@/shared/domain/Result";
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
  return { useCase, profileRepository, routineProposalPort };
}

describe("RF-01.04 CompleteOnboarding — cuestionario de aptitud (RN-14)", () => {
  it("CA-01.04.1 con al menos una respuesta positiva, marca parqFlagged=true y se lo pasa al motor de propuesta", async () => {
    const { useCase, routineProposalPort } = buildUseCase();
    const command = aCompleteOnboardingCommand({
      fitnessQuestionnaireAnswers: [false, false, true, false],
    });

    const result = await useCase.execute(command);

    expect(isOk(result)).toBe(true);
    expect(routineProposalPort.calls).toHaveLength(1);
    expect(routineProposalPort.calls[0]?.parqFlagged).toBe(true);
  });

  it("CA-01.04.1 con todas las respuestas negativas, marca parqFlagged=false", async () => {
    const { useCase, routineProposalPort } = buildUseCase();
    const command = aCompleteOnboardingCommand({
      fitnessQuestionnaireAnswers: [false, false, false, false],
    });

    const result = await useCase.execute(command);

    expect(isOk(result)).toBe(true);
    expect(routineProposalPort.calls[0]?.parqFlagged).toBe(false);
  });

  it("CA-01.04.1 el perfil guardado localmente conserva parqFlagged=true", async () => {
    const { useCase, profileRepository } = buildUseCase();
    const command = aCompleteOnboardingCommand({ fitnessQuestionnaireAnswers: [true] });

    const result = await useCase.execute(command);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.profile.parqFlagged).toBe(true);
    expect(profileRepository.savedProfiles[0]?.parqFlagged).toBe(true);
  });
});
