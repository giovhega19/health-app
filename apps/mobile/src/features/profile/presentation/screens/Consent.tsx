import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui";

/**
 * Pantalla de consentimiento del onboarding (RF-01.07, tarea `F01-T14`).
 * CA-01.07.1: sin marcar el consentimiento de tratamiento de datos de salud,
 * el botón "Continuar" está deshabilitado y un texto explica por qué es
 * necesario (Art. 5.3 de la constitución).
 */
export interface ConsentScreenProps {
  onAccept: () => void;
}

const { explanation, checkboxLabel, continueLabel } = strings.profile.consent;

export function ConsentScreen({ onAccept }: ConsentScreenProps): React.JSX.Element {
  const [consented, setConsented] = useState(false);

  const toggleConsent = (): void => {
    setConsented((previous) => !previous);
  };

  const handleContinue = (): void => {
    if (consented) {
      onAccept();
    }
  };

  return (
    <View style={{ padding: spacing.lg, backgroundColor: colors.background }}>
      <Text
        style={{ color: colors.textSecondary, marginBottom: spacing.md }}
        accessibilityRole="text"
      >
        {explanation}
      </Text>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={checkboxLabel}
        accessibilityState={{ checked: consented }}
        accessibilityHint={explanation}
        onPress={toggleConsent}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 44,
          marginBottom: spacing.lg,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            marginRight: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: consented ? colors.primary : colors.background,
          }}
        />
        <Text style={{ color: colors.textPrimary, flexShrink: 1 }}>{checkboxLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={continueLabel}
        accessibilityState={{ disabled: !consented }}
        accessibilityHint={
          consented ? undefined : strings.profile.consent.explanation
        }
        disabled={!consented}
        onPress={handleContinue}
        style={{
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: consented ? colors.primary : colors.primaryDisabled,
          paddingVertical: spacing.sm,
        }}
      >
        <Text style={{ color: colors.background }}>{continueLabel}</Text>
      </Pressable>
    </View>
  );
}
