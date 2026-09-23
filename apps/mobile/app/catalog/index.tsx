import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { getAppContainer } from "@/composition/container";
import type { AppContainer } from "@/composition/container";
import { CatalogNavigator } from "@/features/catalog/presentation/navigators/CatalogNavigator";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui";

/**
 * Ruta de Expo Router para el catálogo de ejercicios (Art. 3.1: "Expo
 * Router solo en app/"). La pantalla real vive en
 * `features/catalog/presentation/navigators/CatalogNavigator.tsx`.
 */
export default function CatalogRoute(): React.JSX.Element {
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

  return <CatalogNavigator container={container} />;
}
