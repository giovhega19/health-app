/**
 * `SessionDeepLinkPlaceholder` — placeholder de H2 para el deep link
 * `fitapp://session/start?slot=<id>` (`specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 2).
 */
import { render, screen } from "@testing-library/react-native";
import { SessionDeepLinkPlaceholderScreen } from "../SessionDeepLinkPlaceholder";

describe("SessionDeepLinkPlaceholderScreen", () => {
  it("muestra el mensaje 'Disponible próximamente'", async () => {
    await render(<SessionDeepLinkPlaceholderScreen scheduleSlotId="00000000-0000-4000-e200-000000000001" />);

    expect(screen.getByText(/disponible próximamente/i)).toBeTruthy();
    expect(screen.getByText("00000000-0000-4000-e200-000000000001")).toBeTruthy();
  });

  it("funciona sin un scheduleSlotId (deep link sin parámetro)", async () => {
    await render(<SessionDeepLinkPlaceholderScreen scheduleSlotId={null} />);

    expect(screen.getByText(/disponible próximamente/i)).toBeTruthy();
  });
});
