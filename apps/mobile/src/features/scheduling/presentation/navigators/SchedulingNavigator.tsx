import { useCallback, useEffect, useState } from "react";
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { AppContainer } from "@/composition/container";
import { WeeklyCalendarScreen } from "../screens/WeeklyCalendar";
import type { DaySummary } from "../screens/WeeklyCalendar";
import type { DayOfWeek } from "../../domain/ScheduleSlot";

const ALL_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * `SchedulingNavigator` (F04-T13): construye el resumen semanal (CA-04.01.1)
 * cruzando los `ScheduleSlot` activos (`scheduling.listActiveSlots`) con el
 * nombre de su rutina (`routines.getRoutineDetail`, nunca importando
 * internos de `routines`, Art. 2.5) y el estado del permiso de
 * notificaciones (CA-04.01.3). Sin pasos adicionales todavía
 * (`SlotEditor`/`NotificationSettings` quedan para una ronda futura): un
 * único paso, mismo patrón mínimo que el resto de navegadores en memoria de
 * H1/H2.
 */
export interface SchedulingNavigatorProps {
  container: Pick<AppContainer, "scheduling" | "routines">;
}

export function SchedulingNavigator({ container }: SchedulingNavigatorProps): React.JSX.Element {
  const [days, setDays] = useState<DaySummary[]>(ALL_DAYS.map((day) => ({ day, routineName: null })));
  const [permissionDenied, setPermissionDenied] = useState(false);

  const load = useCallback(async () => {
    const slotsResult = await container.scheduling.listActiveSlots.execute();
    if (isOk(slotsResult)) {
      const routineNameById = new Map<string, string>();
      const nextDays: DaySummary[] = ALL_DAYS.map((day) => ({ day, routineName: null }));
      // RN-13 (CA-04.04.1/CA-04.04.2): advertencias que `CreateScheduleSlotsFromProposal`
      // calculó de verdad para los slots creados desde una propuesta (F02).
      const warningBySlotId = new Set(
        container.scheduling.restWarningStore
          .listAll()
          .filter((entry) => entry.warnings.length > 0)
          .map((entry) => entry.scheduleSlotId),
      );

      for (const slot of slotsResult.value) {
        let routineName: string | null | undefined = routineNameById.get(slot.routineId);
        if (routineName === undefined) {
          const detail = await container.routines.getRoutineDetail.execute(slot.routineId);
          routineName = isOk(detail) ? detail.value.name : null;
          if (routineName) {
            routineNameById.set(slot.routineId, routineName);
          }
        }
        for (const day of slot.daysOfWeek) {
          const entry = nextDays.find((candidate) => candidate.day === day);
          if (entry) {
            entry.routineName = routineName ?? entry.routineName;
            entry.scheduleSlotId = slot.id;
            entry.hasRestWarning = warningBySlotId.has(slot.id);
          }
        }
      }

      setDays(nextDays);
    }

    const permissionResult = await container.scheduling.requestNotificationPermission.execute();
    if (isOk(permissionResult)) {
      setPermissionDenied(permissionResult.value.status === "DENIED");
    }
  }, [container]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos en efecto, ver `CatalogNavigator.tsx`.
    void load();
  }, [load]);

  const handleCancel = useCallback(
    async (scheduleSlotId: string) => {
      await container.scheduling.cancelSlot.execute(asId(scheduleSlotId));
      await load();
    },
    [container, load],
  );

  return (
    <WeeklyCalendarScreen
      days={days}
      permissionDenied={permissionDenied}
      onCancel={(scheduleSlotId) => {
        void handleCancel(scheduleSlotId);
      }}
    />
  );
}
