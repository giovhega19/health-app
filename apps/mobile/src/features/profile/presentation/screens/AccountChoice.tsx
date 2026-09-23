import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Crear cuenta" del onboarding (RF-01.01, tarea `F01-T15`): se
 * abre desde "Resumen" al elegir "Crear cuenta" (`SummaryScreen`). Formulario
 * con react-hook-form + zod (Art. 8.2). Validaciones de `spec.md` "Validaciones":
 * contraseña ≥ 8 caracteres; el resto (lista de contraseñas comunes, RFC 5322
 * completo) lo valida el backend.
 */
const schema = z.object({
  email: z.string().email(strings.onboarding.accountChoice.errors.invalidEmail),
  password: z.string().min(8, strings.onboarding.accountChoice.errors.passwordTooShort),
});

export type AccountChoiceFormValues = z.infer<typeof schema>;

export interface AccountChoiceScreenProps {
  onSubmit: (values: AccountChoiceFormValues) => void;
  onBack?: () => void;
  submitting?: boolean;
}

const { title, createAccountCta, emailLabel, passwordLabel } = strings.onboarding.accountChoice;

export function AccountChoiceScreen({ onSubmit, onBack, submitting = false }: AccountChoiceScreenProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AccountChoiceFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>{emailLabel}</Text>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={emailLabel}
            keyboardType="email-address"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            style={inputStyle}
          />
        )}
      />
      {errors.email ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.email.message}
        </Text>
      ) : null}

      <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>{passwordLabel}</Text>
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={passwordLabel}
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            style={inputStyle}
          />
        )}
      />
      {errors.password ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.password.message}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton
          label={createAccountCta}
          disabled={!isValid || submitting}
          onPress={() => {
            void handleSubmit(onSubmit)();
          }}
        />
      </View>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.md,
  minHeight: 44,
};
