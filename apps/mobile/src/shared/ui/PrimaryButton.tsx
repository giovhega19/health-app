import { Pressable, Text } from "react-native";
import { colors, spacing } from "./tokens";

/**
 * Botón primario reutilizable (Art. 8.1: objetivo táctil ≥ 44 pt, roles/labels
 * de accesibilidad en todo control). Usado por las pantallas del asistente de
 * onboarding y de catálogo para no repetir estilos ni accesibilidad en cada
 * pantalla (F08 dueño del design system completo; este es el mínimo viable
 * para H1).
 */
export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  variant?: "primary" | "secondary";
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityHint,
  variant = "primary",
}: PrimaryButtonProps): React.JSX.Element {
  const isSecondary = variant === "secondary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: isSecondary
          ? colors.background
          : disabled
            ? colors.primaryDisabled
            : colors.primary,
        borderWidth: isSecondary ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: isSecondary ? colors.textPrimary : colors.background, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}
