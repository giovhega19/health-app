/**
 * RF-02.04 `AcceptProposal` (`features/catalog/application/AcceptProposal.ts`,
 * tarea `F02-T13`, todavía no implementada: esta prueba falla ahora mismo con
 * "Cannot find module '../AcceptProposal'", el estado rojo esperado).
 *
 * CA-02.04.3 "Aceptar o ajustar la propuesta" — ALCANCE EN H1, confirmado por
 * el dueño del producto (2026-09-22, ver `specs/F02-catalogo-propuesta/spec.md`
 * "Preguntas abiertas" y `plan.md` §2 "Alcance de `AcceptProposal` en H1"):
 * en H1 (F02, sin F03 "routines"/F04 "scheduling" todavía) `AcceptProposal`
 * SOLO valida/ajusta el plan en memoria y emite el evento de dominio
 * `ProposalAccepted { profileId, plan, preferredSchedule }` a través del
 * `EventBus`. NO escribe en "Mis rutinas" ni crea `ScheduleSlot`: esas
 * tablas no existen hasta H2, cuando F03/F04 añadan un suscriptor de este
 * evento (patrón ya usado para `WorkoutSessionCompleted`,
 * `04-arquitectura.md` §3.4 decisión 2). Por eso esta prueba NO hace ninguna
 * aserción sobre persistencia de rutinas/horarios: solo verifica que el
 * evento se publica con el payload correcto. La otra mitad de CA-02.04.3
 * (persistencia real) se prueba en el plan técnico de F03/F04 (H2).
 */
import { AcceptProposal } from "../AcceptProposal";
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";

const PROFILE_ID = asId("00000000-0000-4000-b000-000000000001");

// Plan mínimo, con la forma estructural de `WeeklyPlan`
// (features/catalog/domain/WeeklyPlan.ts): no se construye vía
// `RecommendationEngine` a propósito, para que esta prueba de aplicación no
// dependa de que el dominio ya esté implementado.
const A_WEEKLY_PLAN = {
  days: [
    {
      dayNumber: 1,
      routine: {
        name: "Torso",
        timerDefaults: {
          prepSeconds: 10,
          workSeconds: 40,
          restBetweenSetsSeconds: 60,
          restBetweenExercisesSeconds: 90,
          restBetweenRoundsSeconds: 120,
          halfwayCue: false,
        },
        blocks: [],
      },
      estimatedDurationSeconds: 3200,
    },
  ],
};

const A_PREFERRED_SCHEDULE = [{ dayNumber: 1, preferredTime: "18:00" }];

describe("RF-02.04 AcceptProposal", () => {
  it("CA-02.04.3 al aceptar la propuesta, publica ProposalAccepted con { profileId, plan, preferredSchedule }", async () => {
    const eventBus = new FakeEventBus();
    const clock = new FakeClock("2026-03-01T10:00:00Z");
    const useCase = new AcceptProposal(eventBus, clock);

    const result = await useCase.execute({
      profileId: PROFILE_ID,
      plan: A_WEEKLY_PLAN,
      preferredSchedule: A_PREFERRED_SCHEDULE,
    });

    expect(isOk(result)).toBe(true);

    const published = eventBus.eventsOfType("ProposalAccepted");
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      type: "ProposalAccepted",
      profileId: PROFILE_ID,
      plan: A_WEEKLY_PLAN,
      preferredSchedule: A_PREFERRED_SCHEDULE,
    });
    expect(published[0]?.occurredAt).toEqual(clock.now());
  });

  it("CA-02.04.3 permite ajustar días/horas preferidos antes de confirmar: el preferredSchedule publicado es el ajustado, no uno por defecto", async () => {
    const eventBus = new FakeEventBus();
    const clock = new FakeClock("2026-03-01T10:00:00Z");
    const useCase = new AcceptProposal(eventBus, clock);
    const adjustedSchedule = [{ dayNumber: 3, preferredTime: "06:30" }];

    await useCase.execute({
      profileId: PROFILE_ID,
      plan: A_WEEKLY_PLAN,
      preferredSchedule: adjustedSchedule,
    });

    const [event] = eventBus.eventsOfType("ProposalAccepted");
    expect(event).toMatchObject({ preferredSchedule: adjustedSchedule });
  });
});
