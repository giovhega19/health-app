import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { getAppContainer } from "@/composition/container";
import type { AppContainer } from "@/composition/container";
import { SchedulingNavigator } from "@/features/scheduling/presentation/navigators/SchedulingNavigator";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui";

/**
 * Ruta de Expo Router para "Mi semana" (Art. 3.1: "Expo Router solo en
 * app/"). La pantalla real vive en
 * `features/scheduling/presentation/navigators/SchedulingNavigator.tsx`.
 */
export default function ScheduleRoute(): React.JSX.Element {
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

  return <SchedulingNavigator container={container} />;
}
