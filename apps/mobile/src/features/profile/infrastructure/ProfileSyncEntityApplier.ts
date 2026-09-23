import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Gender } from "@/shared/domain/Gender";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import type { RemoteChange, RepositoryError, SyncEntityApplier } from "@/features/sync";
import { UserProfile } from "../domain/UserProfile";
import { BodyMetric } from "../domain/BodyMetric";
import type { BodyMetricRepository, ProfileRepository } from "../application/ports";

/**
 * `ProfileSyncEntityApplier` (ADR-002/CA-01.01.1, tarea `F01-T08`):
 * implementación del SPI `SyncEntityApplier` (`features/sync`) para
 * `entity ∈ {profile, bodyMetric}` — el equivalente en el cliente del
 * `SyncEntityHandler` del backend (`specs/F01-perfil-onboarding/plan.md`
 * §3). Aplica un `RemoteChange` recibido por `GET /sync/pull` al
 * almacenamiento local (LWW por `updatedAt`, ADR-007: como `save()`/`append()`
 * son upsert, la última escritura gana sin lógica adicional aquí).
 */
export class ProfileSyncEntityApplier implements SyncEntityApplier {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly bodyMetricRepository: BodyMetricRepository,
  ) {}

  supports(entity: string): boolean {
    return entity === "profile" || entity === "bodyMetric";
  }

  async apply(change: RemoteChange): Promise<Result<void, RepositoryError>> {
    if (change.op === "delete") {
      // El borrado remoto de perfil/bodyMetric no tiene un caso de uso propio
      // en H1 (CA-01.08.1 borra localmente vía `DeleteAccount`, no vía sync);
      // se ignora de forma segura en vez de fallar toda la sincronización.
      return ok(undefined);
    }
    if (!change.data) {
      return ok(undefined);
    }

    if (change.entity === "profile") {
      return this.applyProfile(change.data);
    }
    return this.applyBodyMetric(change.data);
  }

  private async applyProfile(data: Record<string, unknown>): Promise<Result<void, RepositoryError>> {
    const profile = UserProfile.fromPersistence(asId(data.id as string), {
      accountId: (data.accountId as string | null) ? asId(data.accountId as string) : null,
      birthDate: new Date(data.birthDate as string),
      gender: data.gender as Gender,
      heightCm: data.heightCm as number,
      goal: data.goal as FitnessGoal,
      level: data.level as Level,
      daysPerWeek: data.daysPerWeek as number,
      minutesPerSession: data.minutesPerSession as number,
      equipment: data.equipment as Equipment[],
      unitSystem: data.unitSystem as UnitSystem,
      targetWeightKg: (data.targetWeightKg as number | null) ?? null,
      parqFlagged: Boolean(data.parqFlagged),
      healthConsentAt: new Date(data.healthConsentAt as string),
    });
    const result = await this.profileRepository.save(profile);
    return isOk(result) ? ok(undefined) : result;
  }

  private async applyBodyMetric(data: Record<string, unknown>): Promise<Result<void, RepositoryError>> {
    const metric = BodyMetric.create({
      id: asId(data.id as string),
      profileId: asId(data.profileId as string),
      date: new Date(data.date as string),
      weightKg: data.weightKg as number,
      waistCm: (data.waistCm as number | null) ?? null,
    });
    const result = await this.bodyMetricRepository.append(metric);
    return isOk(result) ? ok(undefined) : result;
  }
}
