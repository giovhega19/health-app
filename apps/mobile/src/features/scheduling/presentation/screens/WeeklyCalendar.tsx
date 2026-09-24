import { Text, View } from "react-native";
import type { DayOfWeek } from "../../domain/ScheduleSlot";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import { PermissionDeniedBanner } from "../components/PermissionDeniedBanner";

/**
 * `WeeklyCalendar` (CA-04.01.1): calendario semanal con "Descanso" en los
 * días sin programación. CA-04.01.2 ("Reprogramación coherente"): "Cancelar"
 * sobre cada slot programado — punto de entrada UI mínimo para `CancelSlot`
 * (`SlotEditor.tsx` completo queda para una ronda futura, Art. 9.1). RN-13
 * (CA-04.04.1/CA-04.04.2): si `CreateScheduleSlotsFromProposal` calculó una
 * advertencia de descanso para el slot del día, se muestra junto a él.
 */
export interface DaySummary {
  day: DayOfWeek;
  routineName: string | null;
  /** `null`/`undefined` cuando el día no tiene slot (se muestra "Descanso", sin botón "Cancelar"). */
  scheduleSlotId?: string | null;
  /** RN-13: true si `CreateScheduleSlotsFromProposal` dejó una advertencia de descanso para este slot. */
  hasRestWarning?: boolean;
}

export interface WeeklyCalendarScreenProps {
  days: DaySummary[];
  permissionDenied: boolean;
  onOpenSettings?: () => void;
  /** CA-04.01.2: ausente en pantallas que todavía no lo cablean (compatibilidad hacia atrás). */
  onCancel?: (scheduleSlotId: string) => void;
}

const { title, restDay, days: dayLabels, cancelCta, restWarning } = strings.scheduling.calendar;

export function WeeklyCalendarScreen({
  days,
  permissionDenied,
  onOpenSettings,
  onCancel,
}: WeeklyCalendarScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <PermissionDeniedBanner visible={permissionDenied} onOpenSettings={onOpenSettings} />

      {days.map((entry) => (
        <View
          key={entry.day}
          style={{
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{dayLabels[entry.day - 1]}</Text>
            <Text style={{ color: entry.routineName ? colors.textPrimary : colors.textSecondary }}>
              {entry.routineName ?? restDay}
            </Text>
          </View>

          {entry.hasRestWarning ? (
            <Text accessibilityRole="alert" style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
              {restWarning}
            </Text>
          ) : null}

          {entry.scheduleSlotId && onCancel ? (
            <View style={{ marginTop: spacing.xs, alignItems: "flex-start" }}>
              <PrimaryButton
                label={cancelCta}
                variant="secondary"
                onPress={() => onCancel(entry.scheduleSlotId as string)}
                accessibilityHint={entry.routineName ?? undefined}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
