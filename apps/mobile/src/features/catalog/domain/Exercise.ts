import { Entity } from "@/shared/domain/Entity";
import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import type { ExerciseDifficulty } from "@/shared/domain/ExerciseDifficulty";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";

/**
 * `Exercise` (RF-02.01, `05-modelo-dominio-reglas.md` §1 class Exercise).
 * Contenido mínimo del MVP (`specs/F02-catalogo-propuesta/spec.md`): al menos
 * 3 pasos de instrucciones y 2 errores comunes.
 */
export interface ExerciseProps {
  slug: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: ExerciseDifficulty;
  mode: ExerciseMode;
  met: number;
  instructions: string[];
  commonMistakes: string[];
  imageUrl: string;
  animationUrl: string | null;
  videoUrl: string | null;
  isCustom: boolean;
}

export interface ExerciseCreateInput extends ExerciseProps {
  id: Id;
}

const MIN_INSTRUCTIONS = 3;
const MIN_COMMON_MISTAKES = 2;

export class Exercise extends Entity<ExerciseProps> {
  private constructor(id: Id, props: ExerciseProps) {
    super(id, props);
  }

  static create(input: ExerciseCreateInput): Exercise {
    if (input.instructions.length < MIN_INSTRUCTIONS) {
      throw new Error(
        `Exercise requiere al menos ${String(MIN_INSTRUCTIONS)} instrucciones (contenido mínimo del MVP).`,
      );
    }
    if (input.commonMistakes.length < MIN_COMMON_MISTAKES) {
      throw new Error(
        `Exercise requiere al menos ${String(MIN_COMMON_MISTAKES)} errores comunes (contenido mínimo del MVP).`,
      );
    }

    const { id, ...props } = input;
    return new Exercise(id, { ...props });
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get muscleGroups(): MuscleGroup[] {
    return this.props.muscleGroups;
  }

  get equipment(): Equipment[] {
    return this.props.equipment;
  }

  get difficulty(): ExerciseDifficulty {
    return this.props.difficulty;
  }

  get mode(): ExerciseMode {
    return this.props.mode;
  }

  get met(): number {
    return this.props.met;
  }

  get instructions(): string[] {
    return this.props.instructions;
  }

  get commonMistakes(): string[] {
    return this.props.commonMistakes;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get animationUrl(): string | null {
    return this.props.animationUrl;
  }

  get videoUrl(): string | null {
    return this.props.videoUrl;
  }

  get isCustom(): boolean {
    return this.props.isCustom;
  }

  hasVideo(): boolean {
    return this.props.videoUrl !== null && this.props.videoUrl.length > 0;
  }
}
