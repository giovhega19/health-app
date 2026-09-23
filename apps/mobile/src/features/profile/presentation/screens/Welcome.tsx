import { Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla de bienvenida del onboarding (RF-01.02, tarea `F01-T14`):
 * "Bienvenida (mascota saluda)" (`spec.md` "Flujo de onboarding"). La
 * animación/ilustración real de la mascota es de F09 (`04-arquitectura.md`
 * §3.4); aquí se deja el saludo textual, sin bloquear el flujo por un asset
 * que no existe todavía.
 */
export interface WelcomeScreenProps {
  onStart: () => void;
}

const { title, subtitle, cta } = strings.onboarding.welcome;

export function WelcomeScreen({ onStart }: WelcomeScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm }}>
        {title}
      </Text>
      <Text style={{ ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.xl }}>
        {subtitle}
      </Text>
      <PrimaryButton label={cta} onPress={onStart} />
    </View>
  );
}
