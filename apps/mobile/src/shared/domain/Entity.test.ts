import { Entity } from "./Entity";
import { asId } from "./Id";

type TestEntityProps = { name: string };

class TestEntity extends Entity<TestEntityProps> {
  static create(id: string, name: string): TestEntity {
    return new TestEntity(asId(id), { name });
  }

  get name(): string {
    return this.props.name;
  }
}

describe("Entity", () => {
  const idA = "018f1e0a-6d3a-7b3e-8a2e-6d6f7d4e2b3a";
  const idB = "018f1e0a-6d3a-7b3e-8a2e-6d6f7d4e2b3b";

  it("dos entidades con el mismo id son iguales, aunque sus props difieran", () => {
    const a = TestEntity.create(idA, "a");
    const b = TestEntity.create(idA, "props distintas, mismo id");

    expect(a.equals(b)).toBe(true);
  });

  it("dos entidades con ids distintos no son iguales", () => {
    const a = TestEntity.create(idA, "a");
    const b = TestEntity.create(idB, "b");

    expect(a.equals(b)).toBe(false);
  });

  it("una entidad nunca es igual a undefined o null", () => {
    const a = TestEntity.create(idA, "a");

    expect(a.equals(undefined)).toBe(false);
    expect(a.equals(null)).toBe(false);
  });

  it("una entidad es igual a sí misma (atajo de igualdad por referencia)", () => {
    const a = TestEntity.create(idA, "a");

    expect(a.equals(a)).toBe(true);
  });
});
