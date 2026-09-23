/**
 * Errores de dominio de `catalog` (F02), expresados como `Result.err(...)`
 * en vez de excepciones (Art. 2.3 de la constitución, `04-arquitectura.md` §3.1).
 */
export type RecommendationError =
  | { kind: "NO_COMPATIBLE_EXERCISES" }
  | { kind: "MEDICAL_AUTHORIZATION_REQUIRED" };

export type ExerciseNotFoundError = { kind: "NOT_FOUND" };

export type ProposalError = RecommendationError;
