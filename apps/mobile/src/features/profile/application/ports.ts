import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { UserProfile } from "../domain/UserProfile";
import type { BodyMetric } from "../domain/BodyMetric";

/**
 * Puertos de `profile/application` (`specs/F01-perfil-onboarding/plan.md` §3).
 */
export interface RepositoryError {
  kind: "NOT_FOUND" | "STORAGE_ERROR" | "UNKNOWN";
  message?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ProfileRepository {
  save(profile: UserProfile): Promise<Result<void, RepositoryError>>;
  findCurrent(): Promise<Result<UserProfile | null, RepositoryError>>;
  /**
   * Borra el perfil local (CA-01.08.1/Art. 5.4). No estaba en el snippet
   * abreviado de `plan.md` §3; confirmado como parte del puerto real por
   * `dev-mobile-rn` al implementar `F01-T12` (ver reporte de la tarea): sin
   * él, `DeleteAccount` no podría cumplir "se borran los datos locales" sin
   * reinventar un mecanismo de borrado fuera del propio puerto del
   * repositorio.
   */
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface BodyMetricRepository {
  /** Upsert por fecha: si ya existe un registro del mismo día, se reemplaza (CA-01.06.1). */
  append(metric: BodyMetric): Promise<Result<void, RepositoryError>>;
  history(range: DateRange): Promise<Result<BodyMetric[], RepositoryError>>;
  /** Mismo contrato que `ProfileRepository.clear()`, ver comentario ahí (CA-01.08.1). */
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface UserSummary {
  id: Id;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

export interface AuthError {
  code: string;
  message?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  acceptedTermsVersion: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPort {
  register(input: RegisterInput): Promise<Result<AuthSession, AuthError>>;
  login(input: LoginInput): Promise<Result<AuthSession, AuthError>>;
  guestUpgrade(input: RegisterInput): Promise<Result<AuthSession, AuthError>>;
  deleteAccount(): Promise<Result<void, AuthError>>;
}

export interface StorageError {
  kind: "STORAGE_ERROR";
  message?: string;
}

export interface TokenStoragePort {
  save(session: AuthSession): Promise<Result<void, StorageError>>;
  clear(): Promise<Result<void, StorageError>>;
}

/**
 * `RemoteProfilePort` (RF-01.03/RF-01.06, tarea `F01-T12`/`F01-T16`): réplica
 * server-side del perfil vía `PUT /me/profile` (`packages/api-contract/openapi.yaml`
 * `UserProfileDto`). Puerto separado de `AuthPort` porque pertenece al
 * dominio `profile`, no a `identity` (mismo criterio que el backend, que
 * separa los módulos `identity`/`profile`, `plan.md` §2).
 */
export interface RemoteProfilePort {
  update(profile: UserProfile): Promise<Result<void, AuthError>>;
}

/**
 * `ProfileSnapshot`/`WeeklyPlanSummary`/`ProposalError`: DTOs de solo
 * lectura del límite entre `profile` (F01) y `catalog` (F02). `catalog`
 * define la forma real de `WeeklyPlanSummary`/`ProposalError`; aquí se
 * re-declaran de forma estructural para que `profile/application` no
 * importe nada de `features/catalog/**` (Art. 2.5, `plan.md` §1/§3).
 */
export interface ProfileSnapshot {
  profileId: Id;
  goal: import("@/shared/domain/FitnessGoal").FitnessGoal;
  level: import("@/shared/domain/Level").Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: import("@/shared/domain/Equipment").Equipment[];
  parqFlagged: boolean;
}

export type WeeklyPlanSummary = unknown;
export type ProposalError = unknown;

export interface RoutineProposalPort {
  propose(profile: ProfileSnapshot): Promise<Result<WeeklyPlanSummary, ProposalError>>;
}
