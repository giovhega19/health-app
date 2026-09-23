import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { Entity } from "@/shared/domain/Entity";
import type { Id } from "@/shared/domain/Id";
import type { Gender } from "@/shared/domain/Gender";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import { AgeBelowMinimumError } from "./errors";

/**
 * `UserProfile` (RF-01.03, `05-modelo-dominio-reglas.md` §1 class UserProfile).
 * RN-01 (edad mínima), RN-02 (IMC), RN-03 (TMB). El "hoy" siempre llega por
 * parámetro explícito (nunca `Date.now()`/`new Date()` directo, Art. 2.4).
 */
export interface UserProfileProps {
  accountId?: Id | null;
  birthDate: Date;
  gender: Gender;
  heightCm: number;
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: Equipment[];
  unitSystem: UnitSystem;
  targetWeightKg: number | null;
  parqFlagged: boolean;
  healthConsentAt: Date;
}

interface InternalUserProfileProps extends UserProfileProps {
  accountId: Id | null;
}

const MIN_AGE_YEARS = 16;

export function calculateAge(birthDate: Date, today: Date): number {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
  const dayDiff = today.getUTCDate() - birthDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export type BmiCategory = "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESITY";

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25.0) return "NORMAL";
  if (bmi < 30.0) return "OVERWEIGHT";
  return "OBESITY";
}

const GENDER_BMR_CONSTANT: Record<Gender, number> = {
  MALE: 5,
  FEMALE: -161,
  OTHER: -78,
  PREFER_NOT_TO_SAY: -78,
};

export interface CalculateBmrInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}

export function calculateBmr(input: CalculateBmrInput): number {
  const raw =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + GENDER_BMR_CONSTANT[input.gender];
  return Math.round(Math.max(0, raw));
}

export class UserProfile extends Entity<InternalUserProfileProps> {
  private constructor(id: Id, props: InternalUserProfileProps) {
    super(id, props);
  }

  static create(
    id: Id,
    props: UserProfileProps,
    today: Date,
  ): Result<UserProfile, AgeBelowMinimumError> {
    const age = calculateAge(props.birthDate, today);
    if (age < MIN_AGE_YEARS) {
      return err(new AgeBelowMinimumError());
    }
    return ok(new UserProfile(id, { ...props, accountId: props.accountId ?? null }));
  }

  /**
   * Reconstruye un `UserProfile` ya existente (leído de `ProfileRepository`,
   * `specs/F01-perfil-onboarding/plan.md` §4) sin repetir la validación de
   * edad mínima de `create()`: esa validación es una puerta de alta única
   * (RN-01, CA-01.03.1), no un invariante que deba seguir cumpliéndose para
   * siempre — de lo contrario un perfil dejaría de poder leerse el día que su
   * titular, por ejemplo, superara cierta edad máxima hipotética, lo cual no
   * es la regla. Usado únicamente por adaptadores de infraestructura
   * (`infrastructure/SqliteProfileRepository.ts`).
   */
  static fromPersistence(id: Id, props: UserProfileProps): UserProfile {
    return new UserProfile(id, { ...props, accountId: props.accountId ?? null });
  }

  get accountId(): Id | null {
    return this.props.accountId;
  }

  get birthDate(): Date {
    return this.props.birthDate;
  }

  get gender(): Gender {
    return this.props.gender;
  }

  get heightCm(): number {
    return this.props.heightCm;
  }

  get goal(): FitnessGoal {
    return this.props.goal;
  }

  get level(): Level {
    return this.props.level;
  }

  get daysPerWeek(): number {
    return this.props.daysPerWeek;
  }

  get minutesPerSession(): number {
    return this.props.minutesPerSession;
  }

  get equipment(): Equipment[] {
    return this.props.equipment;
  }

  get unitSystem(): UnitSystem {
    return this.props.unitSystem;
  }

  get targetWeightKg(): number | null {
    return this.props.targetWeightKg;
  }

  get parqFlagged(): boolean {
    return this.props.parqFlagged;
  }

  get healthConsentAt(): Date {
    return this.props.healthConsentAt;
  }

  ageAt(today: Date): number {
    return calculateAge(this.props.birthDate, today);
  }

  /** Copia inmutable vinculada a la cuenta recién creada (CA-01.01.1). */
  withAccountId(accountId: Id): UserProfile {
    return new UserProfile(this.id, { ...this.props, accountId });
  }
}
