import { render, screen } from "@testing-library/react";

import { EmptyStatePanel } from "~/components/dashboard/empty-state-panel";

describe("EmptyStatePanel", () => {
  it("renders a dashed empty-state panel with title and description", () => {
    render(
      <EmptyStatePanel
        title="Belum ada dokumen warga"
        description="Unggah dokumen pertama untuk mulai melengkapi profil warga."
      />,
    );

    expect(screen.getByText("Belum ada dokumen warga")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Unggah dokumen pertama untuk mulai melengkapi profil warga.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Belum ada dokumen warga").closest("div")).toHaveClass(
      "border-dashed",
    );
  });

  it("renders children when provided", () => {
    render(
      <EmptyStatePanel title="Belum ada anggota">
        <a href="/dashboard/kk/1/warga/new">Tambah anggota</a>
      </EmptyStatePanel>,
    );

    expect(
      screen.getByRole("link", { name: "Tambah anggota" }),
    ).toHaveAttribute("href", "/dashboard/kk/1/warga/new");
  });

  it("supports a simple variant and custom className", () => {
    render(
      <EmptyStatePanel
        title="Belum ada hasil"
        variant="simple"
        className="bg-muted/40"
      />,
    );

    expect(screen.getByText("Belum ada hasil").closest("div")).not.toHaveClass(
      "border-dashed",
    );
    expect(screen.getByText("Belum ada hasil").closest("div")).toHaveClass(
      "bg-muted/40",
    );
  });

  it("can render a semantic heading when requested", () => {
    render(
      <EmptyStatePanel
        title="Belum ada dokumen warga"
        semanticHeading
        headingLevel="h2"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Belum ada dokumen warga" }),
    ).toBeInTheDocument();
  });
});
