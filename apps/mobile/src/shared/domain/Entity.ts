import type { Id } from "./Id";

/**
 * Base para entidades de dominio identificadas por un `Id` (igualdad por
 * identidad, no por valor). Placeholder fundacional (H0): cada feature
 * extiende esta clase con sus propias reglas de negocio (RN-*) en el plan
 * técnico de la Fxx correspondiente.
 */
export abstract class Entity<TProps> {
  public readonly id: Id;
  protected readonly props: TProps;

  protected constructor(id: Id, props: TProps) {
    this.id = id;
    this.props = props;
  }

  equals(other: Entity<TProps> | undefined | null): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this.id === other.id;
  }
}
