import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, OptionButton, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";

/**
 * Layout compartido por las pantallas de selección única del onboarding
 * (Objetivo, Nivel, Equipo-single no aplica ya que Equipo es multi-selección;
 * lo usan `Goal.tsx`/`Level.tsx`). CA-01.02.1: "máximo una pregunta por
 * pantalla", barra de progreso visible, cada paso se puede retroceder.
 */
export interface SingleChoiceOption<T extends string> {
  value: T;
  label: string;
}

export interface SingleChoiceStepProps<T extends string> {
  title: string;
  options: SingleChoiceOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  onContinue: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

export function SingleChoiceStep<T extends string>({
  title,
  options,
  selected,
  onSelect,
  onContinue,
  onBack,
  step,
  totalSteps,
}: SingleChoiceStepProps<T>): React.JSX.Element {
  const handleContinue = useCallback(() => {
    if (selected) {
      onContinue();
    }
  }, [selected, onContinue]);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>
      <ScrollView accessibilityRole="radiogroup" style={{ flex: 1 }}>
        {options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onPress={() => {
              onSelect(option.value);
            }}
          />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton label={strings.common.continue} onPress={handleContinue} disabled={!selected} />
      </View>
    </View>
  );
}
