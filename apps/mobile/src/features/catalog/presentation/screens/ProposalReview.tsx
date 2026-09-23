import { useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import type { WeeklyPlanDay } from "../../domain/WeeklyPlan";
import type { PreferredScheduleEntry } from "../../domain/events";

/**
 * Pantalla "Revisión de propuesta" (RF-02.04, tarea `F02-T15`). CA-02.04.3:
 * "Cuando acepto la propuesta, las rutinas se copian a 'Mis rutinas'... y
 * puedo cambiar días y horas antes de confirmar". Alcance de H1
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Alcance de AcceptProposal en
 * H1"): esta pantalla permite ajustar la hora preferida por día en memoria y
 * llama a `AcceptProposal` (emite `ProposalAccepted`); no escribe todavía en
 * "Mis rutinas" (F03/F04, H2).
 */
export interface ProposalReviewScreenProps {
  days: WeeklyPlanDay[];
  onAccept: (preferredSchedule: PreferredScheduleEntry[]) => void;
}

const DEFAULT_TIME = "18:00";

export function ProposalReviewScreen({ days, onAccept }: ProposalReviewScreenProps): React.JSX.Element {
  const [times, setTimes] = useState<Record<number, string>>(() =>
    Object.fromEntries(days.map((day) => [day.dayNumber, DEFAULT_TIME])),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {strings.catalog.proposal.title}
      </Text>
      <FlatList
        data={days}
        keyExtractor={(item) => String(item.dayNumber)}
        style={{ flex: 1, marginBottom: spacing.md }}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text accessibilityRole="text" style={{ color: colors.textPrimary }}>
              {strings.catalog.proposal.dayLabel.replace("{{day}}", String(item.dayNumber))} —{" "}
              {strings.catalog.proposal.durationLabel.replace(
                "{{minutes}}",
                String(Math.round(item.estimatedDurationSeconds / 60)),
              )}
            </Text>
            <TextInput
              accessibilityLabel={`Hora preferida día ${String(item.dayNumber)}`}
              value={times[item.dayNumber] ?? DEFAULT_TIME}
              onChangeText={(text) => {
                setTimes((previous) => ({ ...previous, [item.dayNumber]: text }));
              }}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: spacing.xs,
                minWidth: 70,
                minHeight: 44,
                textAlign: "center",
              }}
            />
          </View>
        )}
      />
      <PrimaryButton
        label={strings.catalog.proposal.acceptCta}
        onPress={() => {
          onAccept(
            days.map((day) => ({
              dayNumber: day.dayNumber,
              preferredTime: times[day.dayNumber] ?? DEFAULT_TIME,
            })),
          );
        }}
      />
    </View>
  );
}
