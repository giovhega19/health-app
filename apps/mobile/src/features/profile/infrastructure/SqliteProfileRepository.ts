import { isNull } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Gender } from "@/shared/domain/Gender";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { profiles } from "@/shared/infrastructure/db/schema";
import { UserProfile } from "../domain/UserProfile";
import type { ProfileRepository, RepositoryError } from "../application/ports";

/**
 * `SqliteProfileRepository` (RF-01.03, tarea `F01-T09`): implementa
 * `ProfileRepository` (`application/ports.ts`) sobre Drizzle/SQLite
 * (`shared/infrastructure/db/schema.ts`, tabla `profiles`).
 *
 * En H1 solo existe "el perfil actual" (un único dispositivo, sin
 * multi-perfil todavía): `save` hace upsert por `id` y `findCurrent` toma la
 * fila no borrada más recientemente actualizada.
 */
export class SqliteProfileRepository implements ProfileRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async save(profile: UserProfile): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      const row = {
        id: profile.id,
        accountId: profile.accountId,
        birthDate: profile.birthDate.toISOString(),
        gender: profile.gender,
        heightCm: profile.heightCm,
        goal: profile.goal,
        level: profile.level,
        daysPerWeek: profile.daysPerWeek,
        minutesPerSession: profile.minutesPerSession,
        equipment: profile.equipment,
        unitSystem: profile.unitSystem,
        targetWeightKg: profile.targetWeightKg,
        parqFlagged: profile.parqFlagged,
        healthConsentAt: profile.healthConsentAt.toISOString(),
        updatedAt: nowIso,
        deletedAt: null,
      };

      await this.db
        .insert(profiles)
        .values(row)
        .onConflictDoUpdate({ target: profiles.id, set: row });

      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async findCurrent(): Promise<Result<UserProfile | null, RepositoryError>> {
    try {
      const active = await this.db.select().from(profiles).where(isNull(profiles.deletedAt));
      if (active.length === 0) {
        return ok(null);
      }
      const latest = active.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
      return ok(mapRowToProfile(latest));
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(profiles);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

interface ProfileRow {
  id: string;
  accountId: string | null;
  birthDate: string;
  gender: string;
  heightCm: number;
  goal: string;
  level: string;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: string[];
  unitSystem: string;
  targetWeightKg: number | null;
  parqFlagged: boolean;
  healthConsentAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapRowToProfile(row: ProfileRow): UserProfile {
  return UserProfile.fromPersistence(asId(row.id), {
    accountId: row.accountId ? asId(row.accountId) : null,
    birthDate: new Date(row.birthDate),
    gender: row.gender as Gender,
    heightCm: row.heightCm,
    goal: row.goal as FitnessGoal,
    level: row.level as Level,
    daysPerWeek: row.daysPerWeek,
    minutesPerSession: row.minutesPerSession,
    equipment: row.equipment as Equipment[],
    unitSystem: row.unitSystem as UnitSystem,
    targetWeightKg: row.targetWeightKg,
    parqFlagged: row.parqFlagged,
    healthConsentAt: new Date(row.healthConsentAt),
  });
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
