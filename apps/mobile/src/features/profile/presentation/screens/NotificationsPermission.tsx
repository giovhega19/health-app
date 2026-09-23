import { Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Permiso de notificaciones" del onboarding (RF-01.02, tarea
 * `F01-T15`, en contexto tras elegir cuenta/invitado, `spec.md` "Flujo de
 * onboarding"). `expo-notifications` no está instalado en esta ronda (no
 * estaba en el alcance explícito de infraestructura encargado): esta
 * pantalla deja el punto de extensión listo (`onAllow`/`onSkip`, inyectados
 * por la ruta) para conectar la petición real de permiso cuando F08/una
 * ronda futura instale `expo-notifications`, sin cambiar esta pantalla.
 */
export interface NotificationsPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
}

const { title, subtitle, allowCta, skipCta } = strings.onboarding.notifications;

export function NotificationsPermissionScreen({ onAllow, onSkip }: NotificationsPermissionScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm }}>
        {title}
      </Text>
      <Text style={{ ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.xl }}>{subtitle}</Text>
      <PrimaryButton label={allowCta} onPress={onAllow} />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton label={skipCta} variant="secondary" onPress={onSkip} />
    </View>
  );
}
