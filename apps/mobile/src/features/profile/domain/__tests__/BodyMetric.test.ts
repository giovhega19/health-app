/**
 * Prueba unitaria añadida por `dev-mobile-rn` (no de QA) para `BodyMetric`
 * (`05-modelo-dominio-reglas.md` §1: `id; date; weightKg; waistCm?`), cuyos
 * getters no los ejercita ninguna prueba de QA directamente (solo se usa a
 * través de los fakes de repositorio). Requerida para cumplir el umbral de
 * cobertura de dominio (Art. 3.2: ≥ 90 %).
 */
import { BodyMetric } from "../BodyMetric";
import { asId } from "@/shared/domain/Id";

describe("BodyMetric", () => {
  it("expone profileId, date, weightKg y waistCm", () => {
    const date = new Date("2026-09-22T10:00:00Z");

    const metric = BodyMetric.create({
      id: asId("00000000-0000-4000-b100-000000000001"),
      profileId: asId("00000000-0000-4000-b100-000000000002"),
      date,
      weightKg: 59.5,
      waistCm: 80,
    });

    expect(metric.profileId).toBe(asId("00000000-0000-4000-b100-000000000002"));
    expect(metric.date).toEqual(date);
    expect(metric.weightKg).toBe(59.5);
    expect(metric.waistCm).toBe(80);
  });

  it("acepta waistCm nulo", () => {
    const metric = BodyMetric.create({
      id: asId("00000000-0000-4000-b100-000000000003"),
      profileId: asId("00000000-0000-4000-b100-000000000004"),
      date: new Date("2026-09-22T10:00:00Z"),
      weightKg: 60,
      waistCm: null,
    });

    expect(metric.waistCm).toBeNull();
  });
});
