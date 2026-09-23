import { Entity } from "@/shared/domain/Entity";
import type { Id } from "@/shared/domain/Id";

/**
 * `BodyMetric` (`05-modelo-dominio-reglas.md` §1: `id; date; weightKg; waistCm?`).
 */
export interface BodyMetricProps {
  profileId: Id;
  date: Date;
  weightKg: number;
  waistCm: number | null;
}

export interface BodyMetricCreateInput extends BodyMetricProps {
  id: Id;
}

export class BodyMetric extends Entity<BodyMetricProps> {
  private constructor(id: Id, props: BodyMetricProps) {
    super(id, props);
  }

  static create(input: BodyMetricCreateInput): BodyMetric {
    const { id, ...props } = input;
    return new BodyMetric(id, { ...props });
  }

  get profileId(): Id {
    return this.props.profileId;
  }

  get date(): Date {
    return this.props.date;
  }

  get weightKg(): number {
    return this.props.weightKg;
  }

  get waistCm(): number | null {
    return this.props.waistCm;
  }
}
