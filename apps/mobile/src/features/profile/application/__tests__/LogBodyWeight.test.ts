/**
 * RF-01.06 `LogBodyWeight` (`features/profile/application/LogBodyWeight.ts`,
 * tarea `F01-T11`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../LogBodyWeight'", el estado rojo esperado).
 *
 * CA-01.06.1 Registrar peso: "registro 59,5 kg con fecha de hoy -> se agrega
 * al historial, se emite el evento BodyWeightLogged, y si ya existía un
 * registro de hoy, se reemplaza".
 */
import { LogBodyWeight } from "../LogBodyWeight";
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

function buildUseCase(clock: FakeClock) {
  const bodyMetricRepository = new FakeBodyMetricRepository();
  const profileRepository = new FakeProfileRepository();
  const eventBus = new FakeEventBus();

  const created = UserProfile.create(
    asId("00000000-0000-4000-b000-000000000002"),
    aUserProfileProps(),
    clock.now(),
  );
  if (isOk(created)) {
    profileRepository.current = created.value;
  }

  const useCase = new LogBodyWeight({ bodyMetricRepository, profileRepository, eventBus, clock });
  return { useCase, bodyMetricRepository, eventBus };
}

describe("RF-01.06 LogBodyWeight", () => {
  it("CA-01.06.1 registra 59,5 kg con fecha de hoy y lo agrega al historial", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const { useCase, bodyMetricRepository } = buildUseCase(clock);

    const result = await useCase.execute({ weightKg: 59.5, date: clock.now() });

    expect(isOk(result)).toBe(true);
    expect(bodyMetricRepository.all()).toHaveLength(1);
    expect(bodyMetricRepository.all()[0]?.weightKg).toBe(59.5);
  });

  it("CA-01.06.1 emite el evento BodyWeightLogged al registrar el peso", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const { useCase, eventBus } = buildUseCase(clock);

    await useCase.execute({ weightKg: 59.5, date: clock.now() });

    const events = eventBus.eventsOfType("BodyWeightLogged");
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as { weightKg: number }).weightKg).toBe(59.5);
  });

  it("CA-01.06.1 si ya existía un registro de hoy, se reemplaza (no se duplica)", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const { useCase, bodyMetricRepository } = buildUseCase(clock);

    await useCase.execute({ weightKg: 60.0, date: clock.now() });
    await useCase.execute({ weightKg: 59.5, date: clock.now() });

    expect(bodyMetricRepository.all()).toHaveLength(1);
    expect(bodyMetricRepository.all()[0]?.weightKg).toBe(59.5);
  });

  it("un registro en un día distinto se agrega como una entrada nueva (no reemplaza la de hoy)", async () => {
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const { useCase, bodyMetricRepository } = buildUseCase(clock);

    await useCase.execute({ weightKg: 60.0, date: new Date("2026-09-21T10:00:00Z") });
    await useCase.execute({ weightKg: 59.5, date: clock.now() });

    expect(bodyMetricRepository.all()).toHaveLength(2);
  });
});
