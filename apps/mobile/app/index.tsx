import { StyleSheet, Text, View } from "react-native";

/**
 * Ruta placeholder: solo confirma que la app arranca (H0, T08).
 * Las pantallas reales viven en `features/<nombre>/presentation` y esta ruta
 * delegará en ellas a medida que se implemente cada Fxx.
 */
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" accessibilityLabel="FitApp" style={styles.text}>
        FitApp
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
  },
});
