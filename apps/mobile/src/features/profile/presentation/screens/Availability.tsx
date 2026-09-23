import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Disponibilidad" del onboarding (RF-01.02, tarea `F01-T14`): días
 * por semana y minutos por sesión. Formulario con react-hook-form + zod
 * (Art. 8.2 "Formularios con react-hook-form + zod"): a diferencia de las
 * pantallas de selección única (`Goal`/`Level`), aquí hay dos campos
 * numéricos con rango válido (`packages/api-contract/openapi.yaml`
 * `UserProfileDto`: `daysPerWeek` 1-7, `minutesPerSession` 10-120).
 *
 * El esquema valida los campos como texto (`TextInput` de React Native
 * siempre entrega `string` en `onChangeText`) en vez de `z.coerce.number()`:
 * `z.coerce` hace que el tipo de "entrada" del resolver sea `unknown`, lo que
 * rompe la inferencia de tipos de `useForm<T>` con react-hook-form 7 (el
 * resolver esperaría `T` de entrada = `T` de salida). Los valores numéricos
 * se convierten explícitamente al llamar a `onContinue`.
 */
const schema = z.object({
  daysPerWeek: z
    .string()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 7, {
      message: "1-7",
    }),
  minutesPerSession: z
    .string()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 10 && Number(value) <= 120, {
      message: "10-120",
    }),
});

type FormValues = z.infer<typeof schema>;

export interface AvailabilityFormValues {
  daysPerWeek: number;
  minutesPerSession: number;
}

export interface AvailabilityScreenProps {
  defaultValues?: Partial<AvailabilityFormValues>;
  onContinue: (values: AvailabilityFormValues) => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const { title, daysLabel, minutesLabel } = strings.onboarding.availability;

export function AvailabilityScreen({
  defaultValues,
  onContinue,
  onBack,
  step,
  totalSteps,
}: AvailabilityScreenProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      daysPerWeek: String(defaultValues?.daysPerWeek ?? 3),
      minutesPerSession: String(defaultValues?.minutesPerSession ?? 30),
    },
  });

  const submit = handleSubmit((values) => {
    onContinue({ daysPerWeek: Number(values.daysPerWeek), minutesPerSession: Number(values.minutesPerSession) });
  });

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <Text accessibilityRole="text" style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>
        {daysLabel}
      </Text>
      <Controller
        control={control}
        name="daysPerWeek"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={daysLabel}
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: spacing.sm,
              marginBottom: spacing.md,
              minHeight: 44,
            }}
          />
        )}
      />
      {errors.daysPerWeek ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.daysPerWeek.message}
        </Text>
      ) : null}

      <Text accessibilityRole="text" style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>
        {minutesLabel}
      </Text>
      <Controller
        control={control}
        name="minutesPerSession"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={minutesLabel}
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: spacing.sm,
              marginBottom: spacing.md,
              minHeight: 44,
            }}
          />
        )}
      />
      {errors.minutesPerSession ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.minutesPerSession.message}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton
          label={strings.common.continue}
          disabled={!isValid}
          onPress={() => {
            void submit();
          }}
        />
      </View>
    </View>
  );
}
