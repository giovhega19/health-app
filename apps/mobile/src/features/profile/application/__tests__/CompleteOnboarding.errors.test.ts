/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para cubrir las
 * ramas de propagación de errores de `CompleteOnboarding` (guardar el
 * perfil, registrar el primer `BodyMetric` y obtener la propuesta), que los
 * fakes de QA (`FakeProfileRepository`/`FakeBodyMetricRepository`) no
 * pueden forzar a fallar. Requeridas para cumplir el umbral de cobertura de
 * aplicación (Art. 3.2: ≥ 80 %).
 */
import { CompleteOnboarding } from "../CompleteOnboarding";
import { err, isErr } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { UserProfile } from "@/features/profile/domain/UserProfile";
import type { BodyMetric } from "@/features/profile/domain/BodyMetric";
import type { BodyMetricRepository, ProfileRepository, RepositoryError } from "../ports";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeRoutineProposalPort } from "@test/fakes/FakeRoutineProposalPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aCompleteOnboardingCommand } from "@test/fakes/aCompleteOnboardingCommand";

const REPOSITORY_ERROR: RepositoryError = { kind: "STORAGE_ERROR", message: "boom" };

class FailingSaveProfileRepository implements ProfileRepository {
  async save(_profile: UserProfile): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
  async findCurrent(): Promise<Result<UserProfile | null, RepositoryError>> {
    return { ok: true, value: null };
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return { ok: true, value: undefined };
  }
}

class FailingAppendBodyMetricRepository implements BodyMetricRepository {
  async append(_metric: BodyMetric): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
  async history(): Promise<Result<BodyMetric[], RepositoryError>> {
    return { ok: true, value: [] };
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return { ok: true, value: undefined };
  }
}

describe("CompleteOnboarding — ramas de error", () => {
  it("propaga el error cuando ProfileRepository.save falla", async () => {
    const useCase = new CompleteOnboarding({
      profileRepository: new FailingSaveProfileRepository(),
      bodyMetricRepository: new FakeBodyMetricRepository(),
      routineProposalPort: new FakeRoutineProposalPort(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-22T10:00:00Z"),
    });

    const result = await useCase.execute(aCompleteOnboardingCommand());

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando BodyMetricRepository.append falla", async () => {
    const useCase = new CompleteOnboarding({
      profileRepository: new FakeProfileRepository(),
      bodyMetricRepository: new FailingAppendBodyMetricRepository(),
      routineProposalPort: new FakeRoutineProposalPort(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-22T10:00:00Z"),
    });

    const result = await useCase.execute(aCompleteOnboardingCommand());

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando RoutineProposalPort.propose falla", async () => {
    const routineProposalPort = new FakeRoutineProposalPort();
    routineProposalPort.result = err({ kind: "NO_COMPATIBLE_EXERCISES" });
    const useCase = new CompleteOnboarding({
      profileRepository: new FakeProfileRepository(),
      bodyMetricRepository: new FakeBodyMetricRepository(),
      routineProposalPort,
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-22T10:00:00Z"),
    });

    const result = await useCase.execute(aCompleteOnboardingCommand());

    expect(isErr(result)).toBe(true);
  });
});
