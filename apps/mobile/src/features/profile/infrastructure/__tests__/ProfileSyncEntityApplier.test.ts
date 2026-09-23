/**
 * `ProfileSyncEntityApplier` (ADR-002/CA-01.01.1, tarea `F01-T08`): aplica
 * cambios remotos de `profile`/`bodyMetric` al almacenamiento local.
 */
import { isOk } from "@/shared/domain/Result";
import { ProfileSyncEntityApplier } from "../ProfileSyncEntityApplier";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import type { RemoteChange } from "@/features/sync";

describe("RF-01.01 ProfileSyncEntityApplier", () => {
  it("supports() solo acepta profile y bodyMetric", () => {
    const applier = new ProfileSyncEntityApplier(new FakeProfileRepository(), new FakeBodyMetricRepository());

    expect(applier.supports("profile")).toBe(true);
    expect(applier.supports("bodyMetric")).toBe(true);
    expect(applier.supports("workoutSession")).toBe(false);
  });

  it("CA-01.01.1 aplica un cambio remoto de profile guardándolo localmente", async () => {
    const profileRepository = new FakeProfileRepository();
    const applier = new ProfileSyncEntityApplier(profileRepository, new FakeBodyMetricRepository());
    const change: RemoteChange = {
      entity: "profile",
      op: "upsert",
      id: "00000000-0000-4000-b000-000000000008",
      updatedAt: "2026-09-22T10:00:00Z",
      data: {
        id: "00000000-0000-4000-b000-000000000008",
        accountId: null,
        birthDate: "1996-01-15T00:00:00.000Z",
        gender: "FEMALE",
        heightCm: 165,
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        daysPerWeek: 3,
        minutesPerSession: 30,
        equipment: ["NONE"],
        unitSystem: "METRIC",
        targetWeightKg: null,
        parqFlagged: false,
        healthConsentAt: "2026-09-22T10:00:00.000Z",
      },
    };

    const result = await applier.apply(change);

    expect(isOk(result)).toBe(true);
    expect(profileRepository.savedProfiles).toHaveLength(1);
  });

  it("aplica un cambio remoto de bodyMetric", async () => {
    const bodyMetricRepository = new FakeBodyMetricRepository();
    const applier = new ProfileSyncEntityApplier(new FakeProfileRepository(), bodyMetricRepository);
    const change: RemoteChange = {
      entity: "bodyMetric",
      op: "upsert",
      id: "00000000-0000-4000-b000-000000000009",
      updatedAt: "2026-09-22T10:00:00Z",
      data: {
        id: "00000000-0000-4000-b000-000000000009",
        profileId: "00000000-0000-4000-b000-000000000008",
        date: "2026-09-22T00:00:00.000Z",
        weightKg: 59.5,
        waistCm: null,
      },
    };

    const result = await applier.apply(change);

    expect(isOk(result)).toBe(true);
    expect(bodyMetricRepository.appendCalls).toHaveLength(1);
  });

  it("ignora los cambios op=delete (sin caso de uso propio en H1)", async () => {
    const applier = new ProfileSyncEntityApplier(new FakeProfileRepository(), new FakeBodyMetricRepository());

    const result = await applier.apply({
      entity: "profile",
      op: "delete",
      id: "x",
      updatedAt: "2026-09-22T10:00:00Z",
    });

    expect(isOk(result)).toBe(true);
  });
});
