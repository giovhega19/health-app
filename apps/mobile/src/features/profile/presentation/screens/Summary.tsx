import { FlatList, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import type { BmiCategory } from "../../domain/UserProfile";
import { colors, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Resumen" del onboarding (RF-01.05, tarea `F01-T15`, bloqueada
 * por `F02-T10` — ya completada, ver `specs/F01-perfil-onboarding/tasks.md`).
 * CA-01.05.1: muestra IMC/TMB con el aviso "Estimación, no es consejo
 * médico" (Art. 5.1). CA-01.02.1: muestra el plan semanal propuesto
 * (`WeeklyPlanSummary` de F02) antes de elegir Crear cuenta/Continuar como
 * invitado. Componente presentacional puro: recibe los valores ya
 * calculados (por `CompleteOnboarding`, que a su vez usa `RoutineProposalPort`
 * -> `generateProposal` de `catalog`), no llama a la composición
 * directamente (eso lo hace el hook/ruta que la envuelve).
 */
export interface SummaryPlanDay {
  dayNumber: number;
  durationMinutes: number;
}

export interface SummaryScreenProps {
  bmi: number;
  bmiCategory: BmiCategory;
  bmr: number;
  plan: SummaryPlanDay[] | null;
  onCreateAccount: () => void;
  onContinueAsGuest: () => void;
}

const { title, bmiLabel, bmiCategory: bmiCategoryLabels, bmrLabel, disclaimer, planTitle, planDayLabel, noPlanAvailable } =
  strings.onboarding.summary;

export function SummaryScreen({
  bmi,
  bmiCategory,
  bmr,
  plan,
  onCreateAccount,
  onContinueAsGuest,
}: SummaryScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={9} totalSteps={9} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
        <Text accessibilityRole="text" style={{ color: colors.textPrimary }}>
          {bmiLabel}: {bmi.toFixed(1)} ({bmiCategoryLabels[bmiCategory]})
        </Text>
      </View>
      <Text accessibilityRole="text" style={{ color: colors.textPrimary, marginBottom: spacing.sm }}>
        {bmrLabel}: {Math.round(bmr)}
      </Text>
      <Text accessibilityRole="text" style={{ color: colors.textSecondary, ...typography.label, marginBottom: spacing.lg }}>
        {disclaimer}
      </Text>

      <Text accessibilityRole="header" style={{ ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm }}>
        {planTitle}
      </Text>
      {plan && plan.length > 0 ? (
        <FlatList
          data={plan}
          keyExtractor={(item) => String(item.dayNumber)}
          style={{ flex: 1, marginBottom: spacing.md }}
          renderItem={({ item }) => (
            <Text accessibilityRole="text" style={{ color: colors.textPrimary, marginBottom: spacing.xs }}>
              {planDayLabel.replace("{{day}}", String(item.dayNumber))} — {item.durationMinutes} min
            </Text>
          )}
        />
      ) : (
        <Text accessibilityRole="text" style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
          {noPlanAvailable}
        </Text>
      )}

      <PrimaryButton label={strings.onboarding.accountChoice.createAccountCta} onPress={onCreateAccount} />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={strings.onboarding.accountChoice.continueAsGuestCta}
        variant="secondary"
        onPress={onContinueAsGuest}
      />
    </View>
  );
}
