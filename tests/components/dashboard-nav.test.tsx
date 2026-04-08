import { createElement } from "react";
import { render, screen } from "@testing-library/react";

const pathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement("a", { href: String(href), ...props }, children),
}));

import { DashboardNav } from "~/app/dashboard/_components/dashboard-nav";

describe("DashboardNav", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });

  it("marks nested kk routes as active", () => {
    pathnameMock.mockReturnValue("/dashboard/kk/abc/edit");
    render(createElement(DashboardNav, { orientation: "horizontal" }));

    expect(
      screen.getByRole("link", { name: /kartu keluarga/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: /dashboard/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders vertical navigation links", () => {
    pathnameMock.mockReturnValue("/dashboard/dokumen");
    render(createElement(DashboardNav, { orientation: "vertical" }));

    expect(screen.getByRole("link", { name: /dokumen/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
