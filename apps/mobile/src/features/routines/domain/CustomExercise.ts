import { Entity } from "@/shared/domain/Entity";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { CustomExerciseValidationError } from "./errors";

/**
 * `CustomExercise` (RF-03.07, CA-03.08.3, `specs/F03-editor-rutinas/plan.md`
 * §1 "Decisión de diseño: ejercicios personalizados"). A propósito NO
 * reutiliza `catalog.Exercise` (que exige contenido curado mínimo: 3
 * instrucciones + 2 errores comunes) — un ejercicio personalizado de usuario
 * solo necesita nombre, notas opcionales, foto opcional, grupos musculares y
 * modo.
 *
 * RF-03.07: exige nombre no vacío y al menos un grupo muscular.
 */
export interface CustomExerciseProps {
  name: string;
  notes: string | null;
  photoUri: string | null;
  muscleGroups: MuscleGroup[];
  mode: ExerciseMode;
}

export interface CustomExerciseCreateInput extends CustomExerciseProps {
  id: Id;
}

export class CustomExercise extends Entity<CustomExerciseProps> {
  private constructor(id: Id, props: CustomExerciseProps) {
    super(id, props);
  }

  static create(input: CustomExerciseCreateInput): Result<CustomExercise, CustomExerciseValidationError> {
    const { id, ...props } = input;
    if (props.name.trim().length === 0) {
      return err({ kind: "NAME_REQUIRED" });
    }
    if (props.muscleGroups.length === 0) {
      return err({ kind: "NO_MUSCLE_GROUPS" });
    }
    return ok(new CustomExercise(id, { ...props }));
  }

  get name(): string {
    return this.props.name;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get photoUri(): string | null {
    return this.props.photoUri;
  }

  get muscleGroups(): MuscleGroup[] {
    return this.props.muscleGroups;
  }

  get mode(): ExerciseMode {
    return this.props.mode;
  }
}
