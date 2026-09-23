import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, ProgressBar, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Cuestionario de aptitud" (PAR-Q, RF-01.04, tarea `F01-T14`).
 * CA-01.04.1: si alguna respuesta es "sí", se muestra la recomendación de
 * consultar a un profesional de la salud y hay que marcar "Entiendo" para
 * continuar (RN-14 se aplica más adelante, en `RecommendationEngine`, a
 * partir del `parqFlagged` que esta pantalla calcula).
 */
export interface FitnessQuestionnaireScreenProps {
  onContinue: (answers: boolean[]) => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const { title, questions, yes, no, positiveWarning, understand } = strings.onboarding.fitnessQuestionnaire;

export function FitnessQuestionnaireScreen({
  onContinue,
  onBack,
  step,
  totalSteps,
}: FitnessQuestionnaireScreenProps): React.JSX.Element {
  const [answers, setAnswers] = useState<(boolean | null)[]>(questions.map(() => null));
  const [understood, setUnderstood] = useState(false);

  const answeredAll = answers.every((answer) => answer !== null);
  const hasPositiveAnswer = answers.some((answer) => answer === true);
  const canContinue = useMemo(
    () => answeredAll && (!hasPositiveAnswer || understood),
    [answeredAll, hasPositiveAnswer, understood],
  );

  const setAnswer = (index: number, value: boolean): void => {
    setAnswers((previous) => previous.map((answer, i) => (i === index ? value : answer)));
  };

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <ProgressBar step={step} totalSteps={totalSteps} />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>
      <ScrollView style={{ flex: 1 }}>
        {questions.map((question, index) => (
          <View key={question} style={{ marginBottom: spacing.lg }}>
            <Text accessibilityRole="text" style={{ color: colors.textPrimary, marginBottom: spacing.sm }}>
              {question}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <YesNoButton label={yes} selected={answers[index] === true} onPress={() => { setAnswer(index, true); }} />
              <YesNoButton label={no} selected={answers[index] === false} onPress={() => { setAnswer(index, false); }} />
            </View>
          </View>
        ))}

        {hasPositiveAnswer ? (
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 8,
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text accessibilityRole="alert" style={{ color: "#92400E", marginBottom: spacing.sm }}>
              {positiveWarning}
            </Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={understand}
              accessibilityState={{ checked: understood }}
              onPress={() => {
                setUnderstood((previous) => !previous);
              }}
              style={{ flexDirection: "row", alignItems: "center", minHeight: 44 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: understood ? colors.primary : colors.background,
                }}
              />
              <Text style={{ color: colors.textPrimary }}>{understand}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        {onBack ? <PrimaryButton label={strings.common.back} variant="secondary" onPress={onBack} /> : <View />}
        <PrimaryButton
          label={strings.common.continue}
          disabled={!canContinue}
          onPress={() => {
            onContinue(answers.map((answer) => answer === true));
          }}
        />
      </View>
    </View>
  );
}

function YesNoButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        minWidth: 60,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.background,
      }}
    >
      <Text style={{ color: selected ? colors.background : colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
