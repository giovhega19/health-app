/**
 * `SchedulingPreferences` (VO, `05-modelo-dominio-reglas.md` RN-13/RN-16,
 * `specs/F04-programacion-recordatorios/plan.md` §3 "Decisión de alcance":
 * F04 introduce su propio VO en vez de reutilizar la clase `Preferences`
 * completa del modelo de dominio, que mezcla configuración de F08 todavía
 * no planificada). Persistido en su propia tabla (`scheduling_preferences`,
 * fila única).
 */
export interface QuietHours {
  /** "HH:mm". Puede cruzar medianoche (`start` > `end`, CA-04.06.1). */
  start: string;
  end: string;
}

export interface SchedulingPreferences {
  quietHours: QuietHours | null;
  /** RN-16, por defecto 3. */
  maxNotificationsPerDay: number;
  /** RN-13, por defecto 0 (desactivado). */
  minHoursBetweenRoutines: number;
  /** RN-13, por defecto 48. */
  minHoursSameMuscle: number;
}

export const DEFAULT_SCHEDULING_PREFERENCES: SchedulingPreferences = {
  quietHours: { start: "22:00", end: "07:00" },
  maxNotificationsPerDay: 3,
  minHoursBetweenRoutines: 0,
  minHoursSameMuscle: 48,
};
