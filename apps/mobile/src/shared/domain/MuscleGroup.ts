/**
 * Vocabulario compartido (F02-T03, `specs/F02-catalogo-propuesta/plan.md` §2):
 * taxonomía de grupos musculares principales usada por `catalog/domain/Exercise.ts`
 * y por los filtros de `FilterExercises` (CA-02.02.1). `packages/api-contract/openapi.yaml`
 * modela `ExerciseDto.muscleGroups` como texto libre (taxonomía todavía no
 * fijada como enum cerrado en `05-modelo-dominio-reglas.md`); en el cliente sí
 * se fija esta lista cerrada porque el catálogo semilla y los filtros de la UI
 * la necesitan ya.
 */
export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "LEGS"
  | "SHOULDERS"
  | "ARMS"
  | "CORE"
  | "GLUTES"
  | "CARDIO"
  | "FULL_BODY";
