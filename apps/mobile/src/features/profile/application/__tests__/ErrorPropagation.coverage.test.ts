/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para cubrir
 * ramas de error de `LogBodyWeight`, `ContinueAsGuest`, `CreateAccount` y
 * `DeleteAccount` que los fakes de QA no pueden forzar directamente (algunos
 * sí lo permiten, p. ej. `FakeTokenStoragePort`/`FakeAuthPort`, y se
 * reutilizan aquí). Requeridas para cumplir el umbral de cobertura de
 * aplicación (Art. 3.2: ≥ 80 %).
 */
import { err, isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { UserProfile } from "@/features/profile/domain/UserProfile";
import type { BodyMetric } from "@/features/profile/domain/BodyMetric";
import type { BodyMetricRepository, ProfileRepository, RepositoryError } from "../ports";
import { LogBodyWeight } from "../LogBodyWeight";
import { ContinueAsGuest } from "../ContinueAsGuest";
import { CreateAccount } from "../CreateAccount";
import { DeleteAccount } from "../DeleteAccount";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { UserProfile as UserProfileClass } from "@/features/profile/domain/UserProfile";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

const REPOSITORY_ERROR: RepositoryError = { kind: "STORAGE_ERROR", message: "boom" };

class FailingFindCurrentProfileRepository implements ProfileRepository {
  async save(_profile: UserProfile): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }
  async findCurrent(): Promise<Result<UserProfile | null, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
}

class FailingSaveProfileRepository implements ProfileRepository {
  constructor(private readonly seed: UserProfile) {}
  async save(_profile: UserProfile): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
  async findCurrent(): Promise<Result<UserProfile | null, RepositoryError>> {
    return ok(this.seed);
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }
}

class FailingClearBodyMetricRepository implements BodyMetricRepository {
  async append(_metric: BodyMetric): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }
  async history(): Promise<Result<BodyMetric[], RepositoryError>> {
    return ok([]);
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
}

class FailingAppendBodyMetricRepository implements BodyMetricRepository {
  async append(_metric: BodyMetric): Promise<Result<void, RepositoryError>> {
    return err(REPOSITORY_ERROR);
  }
  async history(): Promise<Result<BodyMetric[], RepositoryError>> {
    return ok([]);
  }
  async clear(): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }
}

function seededProfileRepository(clock: FakeClock): FakeProfileRepository {
  const created = UserProfileClass.create(
    asId("00000000-0000-4000-b200-000000000001"),
    aUserProfileProps(),
    clock.now(),
  );
  if (created.ok) {
    return new FakeProfileRepository(created.value);
  }
  throw new Error("fixture inválida");
}

describe("LogBodyWeight — ramas de error", () => {
  it("devuelve NO_PROFILE cuando no hay perfil actual", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new LogBodyWeight({
      bodyMetricRepository: new FakeBodyMetricRepository(),
      profileRepository: new FakeProfileRepository(null),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({ weightKg: 60, date: clock.now() });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando ProfileRepository.findCurrent falla", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new LogBodyWeight({
      bodyMetricRepository: new FakeBodyMetricRepository(),
      profileRepository: new FailingFindCurrentProfileRepository(),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({ weightKg: 60, date: clock.now() });

    expect(isErr(result)).toBe(true);
  });

  it("un peso fuera de rango (RN-06-like) devuelve error sin llegar al repositorio", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const bodyMetricRepository = new FakeBodyMetricRepository();
    const useCase = new LogBodyWeight({
      bodyMetricRepository,
      profileRepository: seededProfileRepository(clock),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({ weightKg: 1000, date: clock.now() });

    expect(isErr(result)).toBe(true);
    expect(bodyMetricRepository.all()).toHaveLength(0);
  });

  it("propaga el error cuando BodyMetricRepository.append falla", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new LogBodyWeight({
      bodyMetricRepository: new FailingAppendBodyMetricRepository(),
      profileRepository: seededProfileRepository(clock),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({ weightKg: 60, date: clock.now() });

    expect(isErr(result)).toBe(true);
  });
});

describe("ContinueAsGuest — ramas de error", () => {
  it("devuelve NO_PROFILE cuando no hay perfil actual", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new ContinueAsGuest({
      profileRepository: new FakeProfileRepository(null),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando ProfileRepository.findCurrent falla", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new ContinueAsGuest({
      profileRepository: new FailingFindCurrentProfileRepository(),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});

describe("CreateAccount — ramas de error", () => {
  it("devuelve NO_PROFILE cuando no hay perfil local que vincular", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new CreateAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FakeProfileRepository(null),
      tokenStoragePort: new FakeTokenStoragePort(),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando TokenStoragePort.save falla", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const tokenStoragePort = new FakeTokenStoragePort();
    tokenStoragePort.saveResult = err({ kind: "STORAGE_ERROR" });
    const useCase = new CreateAccount({
      authPort: new FakeAuthPort(),
      profileRepository: seededProfileRepository(clock),
      tokenStoragePort,
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando ProfileRepository.findCurrent falla", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const useCase = new CreateAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FailingFindCurrentProfileRepository(),
      tokenStoragePort: new FakeTokenStoragePort(),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando ProfileRepository.save falla al vincular la cuenta", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const created = UserProfileClass.create(
      asId("00000000-0000-4000-b200-000000000002"),
      aUserProfileProps(),
      clock.now(),
    );
    if (!created.ok) throw new Error("fixture inválida");
    const useCase = new CreateAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FailingSaveProfileRepository(created.value),
      tokenStoragePort: new FakeTokenStoragePort(),
      eventBus: new FakeEventBus(),
      clock,
    });

    const result = await useCase.execute({
      email: "ana@fitapp.test",
      password: "Sup3rSecret!",
      acceptedTermsVersion: "1.0",
    });

    expect(isErr(result)).toBe(true);
  });
});

describe("DeleteAccount — ramas de error", () => {
  it("propaga el error cuando ProfileRepository.clear falla", async () => {
    const useCase = new DeleteAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FailingFindCurrentProfileRepository(),
      bodyMetricRepository: new FakeBodyMetricRepository(),
      tokenStoragePort: new FakeTokenStoragePort(),
    });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando BodyMetricRepository.clear falla", async () => {
    const useCase = new DeleteAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FakeProfileRepository(),
      bodyMetricRepository: new FailingClearBodyMetricRepository(),
      tokenStoragePort: new FakeTokenStoragePort(),
    });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando TokenStoragePort.clear falla", async () => {
    const tokenStoragePort = new FakeTokenStoragePort();
    tokenStoragePort.clearResult = err({ kind: "STORAGE_ERROR" });
    const useCase = new DeleteAccount({
      authPort: new FakeAuthPort(),
      profileRepository: new FakeProfileRepository(),
      bodyMetricRepository: new FakeBodyMetricRepository(),
      tokenStoragePort,
    });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});
