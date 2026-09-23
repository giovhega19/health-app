import { Entity } from "@/shared/domain/Entity";
import type { Id } from "@/shared/domain/Id";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";

/**
 * `PredefinedRoutine` (RF-02.03, `05-modelo-dominio-reglas.md` §1 class
 * Routine con `source: PREDEFINED`). No editable por el usuario
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Decisión de diseño"): F03
 * (`UserRoutine`) reutilizará las mismas formas de `shared/domain` sin tocar
 * esta clase.
 */
export interface PredefinedRoutineProps {
  name: string;
  goal: FitnessGoal;
  level: Level;
  timerDefaults: TimerSettings;
  blocks: RoutineBlock[];
  version: number;
  updatedAt: Date;
}

export interface PredefinedRoutineCreateInput extends PredefinedRoutineProps {
  id: Id;
}

export class PredefinedRoutine extends Entity<PredefinedRoutineProps> {
  readonly source = "PREDEFINED" as const;

  private constructor(id: Id, props: PredefinedRoutineProps) {
    super(id, props);
  }

  static create(input: PredefinedRoutineCreateInput): PredefinedRoutine {
    const { id, ...props } = input;
    return new PredefinedRoutine(id, { ...props });
  }

  get name(): string {
    return this.props.name;
  }

  get goal(): FitnessGoal {
    return this.props.goal;
  }

  get level(): Level {
    return this.props.level;
  }

  get timerDefaults(): TimerSettings {
    return this.props.timerDefaults;
  }

  get blocks(): RoutineBlock[] {
    return this.props.blocks;
  }

  get version(): number {
    return this.props.version;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
