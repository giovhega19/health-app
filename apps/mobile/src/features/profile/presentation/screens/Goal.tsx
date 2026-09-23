import { strings } from "@/shared/i18n";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import { SingleChoiceStep } from "../components/SingleChoiceStep";
import type { SingleChoiceOption } from "../components/SingleChoiceStep";

/**
 * Pantalla "Objetivo" del onboarding (RF-01.02, tarea `F01-T14`).
 */
export interface GoalScreenProps {
  selected: FitnessGoal | null;
  onSelect: (goal: FitnessGoal) => void;
  onContinue: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const OPTIONS: SingleChoiceOption<FitnessGoal>[] = (
  ["LOSE_WEIGHT", "ENDURANCE", "MUSCLE_GAIN", "STRENGTH", "GENERAL_HEALTH"] as const
).map((value) => ({ value, label: strings.onboarding.goal.options[value] }));

export function GoalScreen(props: GoalScreenProps): React.JSX.Element {
  return (
    <SingleChoiceStep<FitnessGoal>
      title={strings.onboarding.goal.title}
      options={OPTIONS}
      selected={props.selected}
      onSelect={props.onSelect}
      onContinue={props.onContinue}
      onBack={props.onBack}
      step={props.step}
      totalSteps={props.totalSteps}
    />
  );
}
