import { Text, View } from "react-native";
import { colors, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";

/**
 * `SessionDeepLinkPlaceholder` (`specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 2): pantalla placeholder mínima a la que apuntan las acciones
 * "Iniciar ahora"/"Iniciar" de las notificaciones `PRE_REMINDER`/`START`
 * (`fitapp://session/start?slot=<id>`, `domain/deepLink.ts`). NO inicia
 * ninguna sesión real — `workout-session` (F05, H3) reemplaza únicamente
 * esta pantalla, sin cambiar el contrato de la URL ni la programación de
 * notificaciones (mismo patrón que `NotificationsPermission.tsx` de F01).
 */
export interface SessionDeepLinkPlaceholderProps {
  scheduleSlotId: string | null;
}

const { title, message } = strings.scheduling.sessionPlaceholder;

export function SessionDeepLinkPlaceholderScreen({ scheduleSlotId }: SessionDeepLinkPlaceholderProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: "center" }}>{message}</Text>
      {scheduleSlotId ? (
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>{scheduleSlotId}</Text>
      ) : null}
    </View>
  );
}
