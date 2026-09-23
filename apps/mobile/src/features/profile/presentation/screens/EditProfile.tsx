import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Control } from "react-hook-form";
import { ScrollView, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import { colors, OptionButton, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Editar perfil" (RF-01.03/RF-01.06, tarea `F01-T16`): usa
 * `UpdateProfile`. Solo expone los campos que tiene sentido editar después
 * del onboarding (objetivo, nivel, disponibilidad, estatura, equipo, peso
 * objetivo); `birthDate`/`gender`/`unitSystem`/consentimiento no se editan
 * aquí (`UpdateProfile` los conserva del perfil existente, ver su
 * comentario). Reutiliza los mismos textos de opciones que las pantallas del
 * onboarding (`strings.onboarding.goal/level/equipment`) para no duplicar el
 * diccionario.
 */
const GOAL_VALUES = ["LOSE_WEIGHT", "ENDURANCE", "MUSCLE_GAIN", "STRENGTH", "GENERAL_HEALTH"] as const;
const LEVEL_VALUES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const EQUIPMENT_VALUES = [
  "NONE",
  "DUMBBELLS",
  "PULL_UP_BAR",
  "BANDS",
  "KETTLEBELL",
  "BENCH",
  "JUMP_ROPE",
  "GYM",
] as const;

function numberInRange(min: number, max: number, message: string) {
  return z.string().refine((value) => {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max;
  }, message);
}

const { errors: editProfileErrors } = strings.profile.editProfile;

const schema = z.object({
  goal: z.enum(GOAL_VALUES),
  level: z.enum(LEVEL_VALUES),
  daysPerWeek: numberInRange(1, 7, editProfileErrors.invalidRange),
  minutesPerSession: numberInRange(10, 120, editProfileErrors.invalidRange),
  heightCm: numberInRange(100, 250, editProfileErrors.invalidHeight),
  targetWeightKg: z.string().refine((value) => {
    if (value.trim() === "") return true;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 25 && parsed <= 350;
  }, editProfileErrors.invalidWeight),
});

type FormValues = z.infer<typeof schema>;

export interface EditProfileCurrentValues {
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  heightCm: number;
  equipment: Equipment[];
  targetWeightKg: number | null;
}

export interface EditProfileFormValues {
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  heightCm: number;
  equipment: Equipment[];
  targetWeightKg: number | null;
}

export interface EditProfileScreenProps {
  currentValues: EditProfileCurrentValues;
  onSubmit: (values: EditProfileFormValues) => void;
  submitting?: boolean;
}

const { title, goalLabel, levelLabel, daysLabel, minutesLabel, heightLabel, equipmentLabel, targetWeightLabel, saveCta } =
  strings.profile.editProfile;

export function EditProfileScreen({
  currentValues,
  onSubmit,
  submitting = false,
}: EditProfileScreenProps): React.JSX.Element {
  const [equipment, setEquipment] = useState<Equipment[]>(currentValues.equipment);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      goal: currentValues.goal,
      level: currentValues.level,
      daysPerWeek: String(currentValues.daysPerWeek),
      minutesPerSession: String(currentValues.minutesPerSession),
      heightCm: String(currentValues.heightCm),
      targetWeightKg: currentValues.targetWeightKg === null ? "" : String(currentValues.targetWeightKg),
    },
  });

  const toggleEquipment = (value: Equipment): void => {
    setEquipment((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  };

  const submit = handleSubmit((values) => {
    onSubmit({
      goal: values.goal,
      level: values.level,
      daysPerWeek: Number(values.daysPerWeek),
      minutesPerSession: Number(values.minutesPerSession),
      heightCm: Number(values.heightCm),
      equipment: equipment.length > 0 ? equipment : ["NONE"],
      targetWeightKg: values.targetWeightKg.trim() === "" ? null : Number(values.targetWeightKg),
    });
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>

      <Text style={labelStyle}>{goalLabel}</Text>
      <Controller
        control={control}
        name="goal"
        render={({ field }) => (
          <View accessibilityRole="radiogroup">
            {GOAL_VALUES.map((value) => (
              <OptionButton
                key={value}
                label={strings.onboarding.goal.options[value]}
                selected={field.value === value}
                onPress={() => {
                  field.onChange(value);
                }}
              />
            ))}
          </View>
        )}
      />

      <Text style={labelStyle}>{levelLabel}</Text>
      <Controller
        control={control}
        name="level"
        render={({ field }) => (
          <View accessibilityRole="radiogroup">
            {LEVEL_VALUES.map((value) => (
              <OptionButton
                key={value}
                label={strings.onboarding.level.options[value]}
                selected={field.value === value}
                onPress={() => {
                  field.onChange(value);
                }}
              />
            ))}
          </View>
        )}
      />

      <FormField label={daysLabel} name="daysPerWeek" control={control} keyboardType="number-pad" error={errors.daysPerWeek?.message} />
      <FormField
        label={minutesLabel}
        name="minutesPerSession"
        control={control}
        keyboardType="number-pad"
        error={errors.minutesPerSession?.message}
      />
      <FormField label={heightLabel} name="heightCm" control={control} keyboardType="decimal-pad" error={errors.heightCm?.message} />
      <FormField
        label={targetWeightLabel}
        name="targetWeightKg"
        control={control}
        keyboardType="decimal-pad"
        error={errors.targetWeightKg?.message}
      />

      <Text style={labelStyle}>{equipmentLabel}</Text>
      {EQUIPMENT_VALUES.map((value) => (
        <OptionButton
          key={value}
          role="checkbox"
          label={strings.onboarding.equipment.options[value]}
          selected={equipment.includes(value)}
          onPress={() => {
            toggleEquipment(value);
          }}
        />
      ))}

      <PrimaryButton
        label={saveCta}
        disabled={!isValid || submitting}
        onPress={() => {
          void submit();
        }}
      />
    </ScrollView>
  );
}

const labelStyle = { ...typography.label, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs };

interface FormFieldProps {
  label: string;
  name: "daysPerWeek" | "minutesPerSession" | "heightCm" | "targetWeightKg";
  control: Control<FormValues>;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  error?: string;
}

function FormField({ label, name, control, keyboardType, error }: FormFieldProps): React.JSX.Element {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={labelStyle}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextInput
            accessibilityLabel={label}
            keyboardType={keyboardType ?? "default"}
            value={field.value}
            onChangeText={field.onChange}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: spacing.sm,
              minHeight: 44,
            }}
          />
        )}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
