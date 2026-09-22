import { render } from "@testing-library/react-native";

import IndexScreen from "./index";

describe("IndexScreen", () => {
  // @testing-library/react-native v14+: render() es asíncrono.
  it("renderiza el texto de placeholder que confirma que la app arranca", async () => {
    const { getByText } = await render(<IndexScreen />);

    expect(getByText("FitApp")).toBeTruthy();
  });
});
