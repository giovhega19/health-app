import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";

/**
 * Ruta raíz: menú de navegación manual entre las secciones de H1
 * (onboarding, catálogo, perfil). No hay todavía un flujo real que decida
 * a dónde ir primero (eso llega con F04/F05 y persistencia de sesión) — es
 * solo el punto de entrada para probar cada sección de forma aislada hasta
 * entonces.
 */
export default function IndexScreen(): React.JSX.Element {
  const router = useRouter();
  const { title, onboardingCta, catalogCta, profileCta } = strings.home;

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: "center" }}>
        {title}
      </Text>
      <PrimaryButton
        label={onboardingCta}
        onPress={() => {
          router.push("/onboarding");
        }}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={catalogCta}
        onPress={() => {
          router.push("/catalog");
        }}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={profileCta}
        variant="secondary"
        onPress={() => {
          router.push("/profile");
        }}
      />
    </View>
  );
}
