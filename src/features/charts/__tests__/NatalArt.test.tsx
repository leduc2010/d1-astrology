import { render } from "@testing-library/react-native";

import { NatalArt } from "../components/NatalArt";

describe("NatalArt", () => {
  // Regression: the aspect strokes re-alpha translucent chart tokens, which used to throw.
  test("draws without throwing", () => {
    expect(() => render(<NatalArt />)).not.toThrow();
  });
});
