import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Registrar peso" (RF-01.06, tarea `F01-T16`): usa `LogBodyWeight`
 * (ya implementado, `F01-T11`). CA-01.06.1: registra el peso del día
 * (25-350 kg, tabla "Validaciones" de `spec.md`); la fecha "hoy" la provee
 * quien orquesta esta pantalla (`ProfileNavigator`, vía `container.clock`),
 * no la propia pantalla (Art. 2.4: nunca `new Date()` fuera del borde de
 * composición). Si ya existía un registro de hoy, `LogBodyWeight` lo
 * reemplaza (upsert por fecha) sin que esta pantalla necesite saberlo.
 */
const schema = z.object({
  weightKg: z.string().refine((value) => {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 25 && parsed <= 350;
  }, strings.profile.logWeight.errors.invalidWeight),
});

type FormValues = z.infer<typeof schema>;

export interface LogWeightScreenProps {
  onSubmit: (weightKg: number) => void;
  submitting?: boolean;
}

const { title, weightLabel, saveCta } = strings.profile.logWeight;

export function LogWeightScreen({ onSubmit, submitting = false }: LogWeightScreenProps): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { weightKg: "" },
  });

  const submit = handleSubmit((values) => {
    onSubmit(Number(values.weightKg));
  });

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>{weightLabel}</Text>
      <Controller
        control={control}
        name="weightKg"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={weightLabel}
            keyboardType="decimal-pad"
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
      {errors.weightKg ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C", marginBottom: spacing.sm }}>
          {errors.weightKg.message}
        </Text>
      ) : null}

      <PrimaryButton
        label={saveCta}
        disabled={!isValid || submitting}
        onPress={() => {
          void submit();
        }}
      />
    </View>
  );
}
