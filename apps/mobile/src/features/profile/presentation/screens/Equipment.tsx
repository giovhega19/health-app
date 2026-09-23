import { ScrollView, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import type { Equipment } from "@/shared/domain/Equipment";
import { colors, OptionButton, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Equipo" del onboarding (RF-01.02, tarea `F01-T14`):
 * multi-selección (a diferencia de `Goal`/`Level`, de selección única).
 * Puede continuar sin seleccionar equipo (equivale a `["NONE"]`, coherente
 * con RN-14/CA-02.04.1: "todos los ejercicios requieren solo NONE...").
 */
export interface EquipmentScreenProps {
  selected: Equipment[];
  onToggle: (equipment: Equipment) => void;
  onContinue: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const EQUIPMENT_VALUES = [
  "NONE",
  "DUMBBELLS",
  "PULL_UP_BAR",
  "BANDS",
  "KETTLEBELL",
  "BENCH",
  "JUMP_ROPE",
  "GYM",
] as const;

export function EquipmentScreen({
  selected,
  onToggle,
  onContinue,
  onBack,
  step,
  totalSteps,
}: EquipmentScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {strings.onboarding.equipment.title}
      </Text>
      <ScrollView style={{ flex: 1 }}>
        {EQUIPMENT_VALUES.map((value) => (
          <OptionButton
            key={value}
            role="checkbox"
            label={strings.onboarding.equipment.options[value]}
            selected={selected.includes(value)}
            onPress={() => {
              onToggle(value);
            }}
          />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton label={strings.common.continue} onPress={onContinue} />
      </View>
    </View>
  );
}
