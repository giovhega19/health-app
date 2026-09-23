import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Eliminar cuenta" (RF-01.08, tarea `F01-T16`, HU-01.4): usa
 * `DeleteAccount` (ya implementado, `F01-T12`). CA-01.08.1 "elijo 'Eliminar
 * cuenta' y confirmo escribiendo 'ELIMINAR'": el botón de confirmación
 * permanece deshabilitado hasta que el texto escrito coincide exactamente
 * con la palabra de confirmación (comparación sensible a mayúsculas, sin
 * recortar espacios: una confirmación explícita no debe aceptar variantes).
 */
const { title, warning, confirmationLabel, confirmationWord, confirmCta, cancelCta } = strings.profile.deleteAccount;

export interface DeleteAccountConfirmationScreenProps {
  onConfirm: () => void;
  onCancel?: () => void;
  submitting?: boolean;
}

export function DeleteAccountConfirmationScreen({
  onConfirm,
  onCancel,
  submitting = false,
}: DeleteAccountConfirmationScreenProps): React.JSX.Element {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = confirmationText === confirmationWord;

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>
      <Text accessibilityRole="text" style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
        {warning}
      </Text>

      <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>{confirmationLabel}</Text>
      <TextInput
        accessibilityLabel={confirmationLabel}
        autoCapitalize="characters"
        autoCorrect={false}
        value={confirmationText}
        onChangeText={setConfirmationText}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: spacing.sm,
          marginBottom: spacing.lg,
          minHeight: 44,
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {onCancel ? <PrimaryButton label={cancelCta} variant="secondary" onPress={onCancel} /> : <View />}
        <PrimaryButton
          label={confirmCta}
          disabled={!isConfirmed || submitting}
          accessibilityHint={isConfirmed ? undefined : confirmationLabel}
          onPress={onConfirm}
        />
      </View>
    </View>
  );
}
