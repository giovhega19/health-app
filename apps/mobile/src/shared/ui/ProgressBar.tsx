import type { DimensionValue } from "react-native";
import { View } from "react-native";
import { colors, spacing } from "./tokens";

/**
 * Barra de progreso del asistente de onboarding (`spec.md` "Barra de
 * progreso visible"). `accessibilityRole="progressbar"` +
 * `accessibilityValue` para que el lector de pantalla anuncie el paso
 * actual (Art. 8.1).
 */
export interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps): React.JSX.Element {
  const ratio = totalSteps > 0 ? Math.min(1, Math.max(0, step / totalSteps)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: step }}
      accessibilityLabel={`Paso ${String(step)} de ${String(totalSteps)}`}
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.border,
        marginBottom: spacing.lg,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${String(ratio * 100)}%` as DimensionValue,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
