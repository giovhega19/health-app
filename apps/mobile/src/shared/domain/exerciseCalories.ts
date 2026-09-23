/**
 * RN-04 Calorías estimadas del ejercicio (`05-modelo-dominio-reglas.md` §2):
 *
 *   kcal = MET × 3,5 × pesoKg / 200 × minutosActivos
 *
 * Función pura compartida entre `catalog` (F02) y, más adelante,
 * `progress`/`workout-session` (`specs/F02-catalogo-propuesta/plan.md` §2
 * "Decisión de diseño"). No aplica el valor por defecto de 70 kg "si el
 * perfil no tiene peso": eso es responsabilidad de quien llama a esta
 * función con los tres parámetros explícitos.
 */
export function estimateExerciseCalories(met: number, weightKg: number, activeMinutes: number): number {
  return (met * 3.5 * weightKg * activeMinutes) / 200;
}
