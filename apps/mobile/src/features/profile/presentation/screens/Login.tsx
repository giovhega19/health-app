import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Iniciar sesión" (RF-01.01, tarea `F01-T16`): usa `LoginUser`.
 * Se llega aquí desde el estado "Email ya registrado: se ofrece iniciar
 * sesión" (`spec.md` "Estados de UI", ofrecido por ejemplo desde
 * `AccountChoice.tsx` cuando `CreateAccount`/`guestUpgrade` falla con
 * `EMAIL_ALREADY_REGISTERED`) y también la usa un usuario que reinstala la
 * app (sin perfil local todavía). CA-01.08.1 (última línea): tras eliminar
 * la cuenta, un intento de inicio de sesión con esas credenciales muestra
 * "El correo o la contraseña no son correctos." (`errorCode ===
 * "AUTH_INVALID_CREDENTIALS"`, traducido por `LoginUser`).
 */
const schema = z.object({
  email: z.string().email(strings.profile.login.errors.invalidEmail),
  password: z.string().min(1, strings.profile.login.errors.invalidEmail),
});

export type LoginFormValues = z.infer<typeof schema>;

export interface LoginScreenProps {
  onSubmit: (values: LoginFormValues) => void;
  onBack?: () => void;
  submitting?: boolean;
  /** `AuthError.code` del último intento fallido, o `null` si no hay error. */
  errorCode?: string | null;
}

const { title, emailLabel, passwordLabel, submitCta, errors } = strings.profile.login;

export function LoginScreen({
  onSubmit,
  onBack,
  submitting = false,
  errorCode = null,
}: LoginScreenProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors: formErrors, isValid },
  } = useForm<LoginFormValues>({
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
      {formErrors.email ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {formErrors.email.message}
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

      {errorCode === "AUTH_INVALID_CREDENTIALS" ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.invalidCredentials}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton
          label={submitCta}
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
