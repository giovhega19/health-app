export type WeightUnit = "KG" | "LB";

/**
 * Value object de peso. Placeholder fundacional (H0): lo usan `profile`
 * (F01, métricas corporales) y `workout-session` (F05, registro de series);
 * las reglas de validación y conversión de unidades (RN-*) se agregan en
 * el plan técnico de cada una.
 */
export class Weight {
  private readonly value: number;
  private readonly unit: WeightUnit;

  private constructor(value: number, unit: WeightUnit) {
    this.value = value;
    this.unit = unit;
  }

  static of(value: number, unit: WeightUnit): Weight {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Weight debe ser un número finito >= 0.");
    }
    return new Weight(value, unit);
  }

  toValue(): number {
    return this.value;
  }

  toUnit(): WeightUnit {
    return this.unit;
  }

  equals(other: Weight): boolean {
    return this.value === other.value && this.unit === other.unit;
  }
}
