import { render, screen } from "@testing-library/react";

import { FileAssetRow } from "~/components/dashboard/file-asset-row";

describe("FileAssetRow", () => {
  it("renders file details, open link, and action slot content", () => {
    render(
        <FileAssetRow
          fileName="ktp.pdf"
          mimeType="application/pdf"
          size={2048}
          createdAt={new Date("2024-01-10T12:00:00.000Z")}
          openHref="https://example.com/ktp.pdf"
          actions={<button type="button">Hapus</button>}
        />,
    );

    expect(screen.getByText("ktp.pdf")).toBeInTheDocument();
    expect(screen.getByText(/application\/pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/2.00 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/10 Jan 2024/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /buka dokumen ktp.pdf/i }),
    ).toHaveAttribute("href", "https://example.com/ktp.pdf");
    expect(
      screen.getByRole("button", { name: "Hapus" }),
    ).toBeInTheDocument();
  });

  it("omits the open link when no href is provided", () => {
    render(
        <FileAssetRow
          fileName="surat.png"
          mimeType="image/png"
          size={512}
          createdAt={new Date("2024-02-11T12:00:00.000Z")}
        />,
    );

    expect(screen.getByText(/512 B/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /buka dokumen surat.png/i }),
    ).toBeNull();
  });
});
