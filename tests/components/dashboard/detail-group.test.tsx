import { render, screen } from "@testing-library/react";

import { DetailGroup } from "~/components/dashboard/detail-group";

describe("DetailGroup", () => {
  it("renders grouped detail rows", () => {
    render(
      <DetailGroup
        title="Identitas Dasar"
        description="Informasi utama."
        rows={[
          { label: "NIK", value: "123" },
          { label: "Status", value: "Belum diisi" },
          { label: "Agama", value: "Belum diisi" },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Identitas Dasar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Informasi utama.")).toBeInTheDocument();
    expect(screen.getByText("NIK")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Agama")).toBeInTheDocument();
    expect(screen.getAllByText("Belum diisi")).toHaveLength(2);
  });

  it("omits the description when not provided", () => {
    render(
      <DetailGroup
        title="Data Sosial"
        rows={[{ label: "Pekerjaan", value: "Wiraswasta" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Data Sosial" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/informasi utama/i)).toBeNull();
  });
});
