import { render, screen } from "@testing-library/react";

import { AuditTimeline } from "~/components/dashboard/audit-timeline";

describe("AuditTimeline", () => {
  it("renders audit entries with actor and timestamp", () => {
    render(
      <AuditTimeline
        items={[
          {
            id: "audit-1",
            type: "DOCUMENT_DELETED",
            label: "Dokumen dihapus",
            summary: "Dokumen surat.pdf dihapus.",
            actorName: "Admin RW",
            createdAt: new Date("2024-04-10T12:00:00.000Z"),
            metadata: { fileName: "surat.pdf" },
            source: "audit",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Riwayat Aktivitas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dokumen dihapus")).toBeInTheDocument();
    expect(screen.getByText("Dokumen surat.pdf dihapus.")).toBeInTheDocument();
    expect(screen.getByText(/Admin RW/)).toBeInTheDocument();
    expect(screen.getByText(/10 Apr 2024/)).toBeInTheDocument();
  });

  it("renders an empty state when no timeline items exist", () => {
    render(<AuditTimeline items={[]} />);

    expect(
      screen.getByText("Belum ada aktivitas tercatat."),
    ).toBeInTheDocument();
  });
});
