import type { CustomExerciseRepository, RoutineRepository } from "@/features/routines";
import type {
  NotificationScheduler,
  PlannedNotificationRepository,
  ScheduleSlotRepository,
} from "@/features/scheduling";

/**
 * Purga del resto del almacenamiento local del dispositivo al eliminar la
 * cuenta (CA-01.08.1/Art. 5.4, hallazgo de seguridad H2 "Eliminar cuenta no
 * purga datos locales de rutinas/horarios ni cancela notificaciones").
 *
 * `features/profile/application/DeleteAccount.ts` solo limpia sus propios
 * datos (perfil, peso, tokens) y publica `AccountDeleted`; `profile` no
 * puede importar los internos de `routines`/`scheduling` (Art. 2.5), así que
 * esta orquestación entre features vive en `composition/container.ts`, que
 * la cablea como suscriptor de ese evento (mismo patrón que el
 * `AccountDeletedListener` del backend, `training` escuchando el borrado de
 * `identity`). Extraída a una función propia (en vez de un arrow function
 * inline en `container.ts`) para poder probarla con fakes sin SQLite/red.
 */
export interface PurgeLocalDataOnAccountDeletionDeps {
  userRoutineRepository: RoutineRepository;
  customExerciseRepository: CustomExerciseRepository;
  scheduleSlotRepository: ScheduleSlotRepository;
  plannedNotificationRepository: PlannedNotificationRepository;
  notificationScheduler: NotificationScheduler;
}

export async function purgeLocalDataOnAccountDeletion(
  deps: PurgeLocalDataOnAccountDeletionDeps,
): Promise<void> {
  await deps.userRoutineRepository.clear();
  await deps.customExerciseRepository.clear();
  await deps.scheduleSlotRepository.clear();
  await deps.plannedNotificationRepository.replaceAll([]);
  await deps.notificationScheduler.cancelAll();
}
