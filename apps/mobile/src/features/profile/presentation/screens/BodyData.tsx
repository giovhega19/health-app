import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, TextInput, View } from "react-native";
import { z } from "zod";
import { strings } from "@/shared/i18n";
import type { Gender } from "@/shared/domain/Gender";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import { colors, OptionButton, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";
import { calculateAge } from "../../domain/UserProfile";
import { Height } from "../../domain/Height";
import { poundsToKg } from "../../domain/BodyWeight";

/**
 * Pantalla "Datos corporales" del onboarding (RF-01.03, tarea `F01-T14`).
 * CA-01.03.1 (edad mínima): valida con `calculateAge` (el mismo cálculo de
 * dominio que usa `CompleteOnboarding`, no una copia) contra la fecha "hoy"
 * — aquí sí se usa `new Date()` directamente porque es solo feedback
 * inmediato de formulario en la capa de presentación, no una regla de
 * dominio persistida; la validación autoritativa (RN-01) vuelve a ocurrir
 * en `CompleteOnboarding` con el puerto `Clock` inyectado desde
 * `composition/`. CA-01.03.2 (unidades): con sistema imperial, el
 * formulario pide ft/in y lb y los convierte a cm/kg con `Height`/`BodyWeight`
 * antes de continuar (siempre se guarda en métrico).
 */
const MIN_AGE_YEARS = 16;

function ageSchema() {
  return z.string().refine(
    (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return calculateAge(date, new Date()) >= MIN_AGE_YEARS;
    },
    { message: strings.onboarding.bodyData.errors.ageBelowMinimum },
  );
}

/**
 * Los campos numéricos se validan como texto (`z.string().refine(...)`) en
 * vez de `z.coerce.number()`: `TextInput` de React Native siempre entrega
 * `string` en `onChangeText`, y `z.coerce` hace que el tipo de "entrada" del
 * resolver sea `unknown`, lo que rompe la inferencia de `useForm<T>` con
 * react-hook-form 7 (mismo ajuste que `Availability.tsx`). La conversión a
 * número ocurre explícitamente al enviar el formulario.
 */
function numberInRange(min: number, max: number, message: string) {
  return z.string().refine((value) => {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max;
  }, message);
}

const metricSchema = z.object({
  birthDate: ageSchema(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  heightCm: numberInRange(100, 250, strings.onboarding.bodyData.errors.invalidHeight),
  weightKg: numberInRange(25, 350, strings.onboarding.bodyData.errors.invalidWeight),
});

const imperialSchema = z.object({
  birthDate: ageSchema(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  heightFeet: numberInRange(3, 8, strings.onboarding.bodyData.errors.invalidHeight),
  heightInches: numberInRange(0, 11, strings.onboarding.bodyData.errors.invalidHeight),
  weightLb: numberInRange(55, 770, strings.onboarding.bodyData.errors.invalidWeight),
});

export interface BodyDataResult {
  birthDate: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
}

export interface BodyDataScreenProps {
  unitSystem: UnitSystem;
  onContinue: (result: BodyDataResult) => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const { title, birthDateLabel, genderLabel, heightLabel, weightLabel, genders } = strings.onboarding.bodyData;
const GENDER_VALUES = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

export function BodyDataScreen({ unitSystem, onContinue, onBack, step, totalSteps }: BodyDataScreenProps): React.JSX.Element {
  const isImperial = unitSystem === "IMPERIAL";

  return isImperial ? (
    <ImperialForm onContinue={onContinue} onBack={onBack} step={step} totalSteps={totalSteps} />
  ) : (
    <MetricForm onContinue={onContinue} onBack={onBack} step={step} totalSteps={totalSteps} />
  );
}

interface FormShellProps {
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

function MetricForm({
  onContinue,
  onBack,
  step,
  totalSteps,
}: FormShellProps & { onContinue: (result: BodyDataResult) => void }): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof metricSchema>>({
    resolver: zodResolver(metricSchema),
    mode: "onChange",
    defaultValues: { birthDate: "", gender: "FEMALE", heightCm: "", weightKg: "" },
  });

  const submit = handleSubmit((values) => {
    onContinue({
      birthDate: values.birthDate,
      gender: values.gender,
      heightCm: Number(values.heightCm),
      weightKg: Number(values.weightKg),
    });
  });

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>

      <FormField label={birthDateLabel} name="birthDate" control={control} placeholder="1996-01-15" error={errors.birthDate?.message} />

      <Text style={labelStyle}>{genderLabel}</Text>
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <View accessibilityRole="radiogroup">
            {GENDER_VALUES.map((value) => (
              <OptionButton
                key={value}
                label={genders[value]}
                selected={field.value === value}
                onPress={() => {
                  field.onChange(value);
                }}
              />
            ))}
          </View>
        )}
      />

      <FormField label={heightLabel} name="heightCm" control={control} keyboardType="decimal-pad" error={errors.heightCm?.message} />
      <FormField label={weightLabel} name="weightKg" control={control} keyboardType="decimal-pad" error={errors.weightKg?.message} />

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

function ImperialForm({
  onContinue,
  onBack,
  step,
  totalSteps,
}: FormShellProps & { onContinue: (result: BodyDataResult) => void }): React.JSX.Element {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof imperialSchema>>({
    resolver: zodResolver(imperialSchema),
    mode: "onChange",
    defaultValues: {
      birthDate: "",
      gender: "FEMALE",
      heightFeet: "",
      heightInches: "",
      weightLb: "",
    },
  });

  const submit = handleSubmit((values) => {
    const height = Height.fromFeetInches(Number(values.heightFeet), Number(values.heightInches));
    onContinue({
      birthDate: values.birthDate,
      gender: values.gender,
      heightCm: height.toCm(),
      weightKg: poundsToKg(Number(values.weightLb)),
    });
  });

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>

      <FormField label={birthDateLabel} name="birthDate" control={control} placeholder="1996-01-15" error={errors.birthDate?.message} />

      <Text style={labelStyle}>{genderLabel}</Text>
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <View accessibilityRole="radiogroup">
            {GENDER_VALUES.map((value) => (
              <OptionButton
                key={value}
                label={genders[value]}
                selected={field.value === value}
                onPress={() => {
                  field.onChange(value);
                }}
              />
            ))}
          </View>
        )}
      />

      <FormField label={`${heightLabel} (ft)`} name="heightFeet" control={control} keyboardType="number-pad" error={errors.heightFeet?.message} />
      <FormField label={`${heightLabel} (in)`} name="heightInches" control={control} keyboardType="number-pad" error={errors.heightInches?.message} />
      <FormField label={`${weightLabel} (lb)`} name="weightLb" control={control} keyboardType="decimal-pad" error={errors.weightLb?.message} />

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

const labelStyle = { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs };

interface FormFieldProps {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- helper genérico compartido por dos esquemas zod distintos
  name: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  error?: string;
}

function FormField({ label, name, control, placeholder, keyboardType, error }: FormFieldProps): React.JSX.Element {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={labelStyle}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextInput
            accessibilityLabel={label}
            placeholder={placeholder}
            keyboardType={keyboardType ?? "default"}
            value={field.value === undefined || field.value === null ? "" : String(field.value)}
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

