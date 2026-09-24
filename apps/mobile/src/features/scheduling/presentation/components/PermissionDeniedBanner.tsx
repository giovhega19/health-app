import { Linking, Text, View } from "react-native";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";

/**
 * `PermissionDeniedBanner` (CA-04.01.3): "el calendario muestra un aviso con
 * un botón a los ajustes del sistema; la programación sigue funcionando sin
 * avisos". No se renderiza nada si el permiso no está denegado (la
 * programación funciona igual, en silencio).
 */
export interface PermissionDeniedBannerProps {
  visible: boolean;
  onOpenSettings?: () => void;
}

const { deniedTitle, deniedMessage, openSettingsCta } = strings.scheduling.permission;

export function PermissionDeniedBanner({ visible, onOpenSettings }: PermissionDeniedBannerProps): React.JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs }}>{deniedTitle}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>{deniedMessage}</Text>
      <PrimaryButton
        label={openSettingsCta}
        onPress={onOpenSettings ?? (() => void Linking.openSettings())}
      />
    </View>
  );
}
