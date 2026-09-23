/**
 * RF-02.04 pantalla "Revisión de propuesta". CA-02.04.3: "puedo cambiar días
 * y horas antes de confirmar" y al aceptar se emite la propuesta ajustada
 * (alcance H1: `AcceptProposal` emite `ProposalAccepted`, ver
 * `specs/F02-catalogo-propuesta/plan.md` §2).
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ProposalReviewScreen } from "../ProposalReview";
import type { WeeklyPlanDay } from "../../../domain/WeeklyPlan";

const DAYS: WeeklyPlanDay[] = [
  { dayNumber: 1, routine: { timerDefaults: {} as never, blocks: [] }, estimatedDurationSeconds: 2700 },
  { dayNumber: 2, routine: { timerDefaults: {} as never, blocks: [] }, estimatedDurationSeconds: 3000 },
];

describe("RF-02.04 Pantalla de revisión de propuesta", () => {
  it("CA-02.04.3 muestra cada día del plan con su duración estimada", async () => {
    await render(<ProposalReviewScreen days={DAYS} onAccept={jest.fn()} />);

    expect(screen.getByText(/día 1/i)).toBeTruthy();
    expect(screen.getByText(/45 min/)).toBeTruthy();
    expect(screen.getByText(/día 2/i)).toBeTruthy();
    expect(screen.getByText(/50 min/)).toBeTruthy();
  });

  it("CA-02.04.3 permite ajustar la hora preferida de un día antes de confirmar", async () => {
    const onAccept = jest.fn();
    await render(<ProposalReviewScreen days={DAYS} onAccept={onAccept} />);

    await fireEvent.changeText(screen.getByLabelText(/hora preferida día 1/i), "07:00");
    await fireEvent.press(screen.getByRole("button", { name: /aceptar propuesta/i }));

    expect(onAccept).toHaveBeenCalledWith([
      { dayNumber: 1, preferredTime: "07:00" },
      { dayNumber: 2, preferredTime: "18:00" },
    ]);
  });
});
