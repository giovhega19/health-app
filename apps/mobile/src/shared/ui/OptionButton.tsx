import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { colors, spacing } from "./tokens";

/**
 * Opción de una lista de selección única (Objetivo, Nivel, Equipo del
 * onboarding; CA-01.02.1: "máximo una pregunta por pantalla"). Memoizado
 * (Art. 8.3 rendimiento) porque las pantallas de onboarding re-renderizan al
 * cambiar la selección y estas opciones no cambian de props salvo
 * `selected`.
 */
export interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityHint?: string;
  role?: "radio" | "checkbox";
}

function OptionButtonComponent({
  label,
  selected,
  onPress,
  accessibilityHint,
  role = "radio",
}: OptionButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.background,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.background : colors.border,
          marginRight: spacing.sm,
        }}
      />
      <Text style={{ color: selected ? colors.background : colors.textPrimary, flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}

export const OptionButton = memo(OptionButtonComponent);
