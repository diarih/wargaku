import { createElement } from "react";
import { render, screen } from "@testing-library/react";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";

describe("CompletenessBadge", () => {
  it("renders the complete state", () => {
    render(
      createElement(CompletenessBadge, { status: "complete", score: 100 }),
    );
    expect(screen.getByText("Lengkap 100%")).toBeInTheDocument();
  });

  it("renders warning and critical labels", () => {
    const { rerender } = render(
      createElement(CompletenessBadge, { status: "warning", score: 72 }),
    );
    expect(screen.getByText("Perlu dilengkapi 72%")).toBeInTheDocument();

    rerender(
      createElement(CompletenessBadge, { status: "critical", score: 32 }),
    );
    expect(screen.getByText("Kritis 32%")).toBeInTheDocument();
  });
});
