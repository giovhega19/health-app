import { strings } from "@/shared/i18n";
import type { Level } from "@/shared/domain/Level";
import { SingleChoiceStep } from "../components/SingleChoiceStep";
import type { SingleChoiceOption } from "../components/SingleChoiceStep";

/**
 * Pantalla "Nivel" del onboarding (RF-01.02, tarea `F01-T14`).
 */
export interface LevelScreenProps {
  selected: Level | null;
  onSelect: (level: Level) => void;
  onContinue: () => void;
  onBack?: () => void;
  step: number;
  totalSteps: number;
}

const OPTIONS: SingleChoiceOption<Level>[] = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((value) => ({
  value,
  label: strings.onboarding.level.options[value],
}));

export function LevelScreen(props: LevelScreenProps): React.JSX.Element {
  return (
    <SingleChoiceStep<Level>
      title={strings.onboarding.level.title}
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
