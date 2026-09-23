import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getAppContainer } from "@/composition/container";
import type { AppContainer } from "@/composition/container";
import { OnboardingNavigator } from "@/features/profile/presentation/navigators/OnboardingNavigator";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui";

/**
 * Ruta de Expo Router para el asistente de onboarding (Art. 3.1: "Expo
 * Router solo en app/"; la pantalla real vive en
 * `features/profile/presentation/navigators/OnboardingNavigator.tsx`). Esta
 * ruta solo resuelve el contenedor de composición (asíncrono, abre SQLite)
 * y delega la navegación de "Inicio" al router.
 */
export default function OnboardingRoute(): React.JSX.Element {
  const router = useRouter();
  const [container, setContainer] = useState<AppContainer | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAppContainer().then((resolved) => {
      if (!cancelled) {
        setContainer(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!container) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.lg }}>
        <Text>{strings.common.loading}</Text>
      </View>
    );
  }

  return (
    <OnboardingNavigator
      container={container}
      onFinish={() => {
        router.replace("/");
      }}
    />
  );
}
