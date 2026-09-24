/**
 * `PostponeCounter` — pruebas directas (Art. 3.2). QA no dejó un archivo
 * propio (el VO se ejercita indirectamente vía `PostponeNotification`, pero
 * `createPostponeCounter` nunca llega a invocarse ahí porque los fakes
 * siempre siembran un contador existente).
 */
import { asId } from "@/shared/domain/Id";
import { MAX_POSTPONES_PER_DAY, canPostpone, createPostponeCounter, incrementPostponeCounter } from "../PostponeCounter";

const SLOT_ID = asId("00000000-0000-4000-e200-000000000001");

describe("PostponeCounter", () => {
  it("createPostponeCounter empieza en count=0", () => {
    const counter = createPostponeCounter("2026-09-21", SLOT_ID);
    expect(counter).toEqual({ date: "2026-09-21", scheduleSlotId: SLOT_ID, count: 0 });
  });

  it("canPostpone es true por debajo del máximo y false al alcanzarlo", () => {
    const counter = createPostponeCounter("2026-09-21", SLOT_ID);
    expect(canPostpone(counter)).toBe(true);
    expect(canPostpone({ ...counter, count: MAX_POSTPONES_PER_DAY })).toBe(false);
  });

  it("incrementPostponeCounter aumenta el conteo en 1", () => {
    const counter = createPostponeCounter("2026-09-21", SLOT_ID);
    expect(incrementPostponeCounter(counter).count).toBe(1);
  });
});
