import { createElement } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement("a", { href: String(href), ...props }, children),
}));

vi.mock("~/app/dashboard/_components/document-uploader", () => ({
  DocumentUploader: ({ residentId }: { residentId?: string }) =>
    createElement("div", null, `DocumentUploader:${residentId ?? ""}`),
}));

vi.mock("~/app/dashboard/_components/file-delete-button", () => ({
  FileDeleteButton: ({ fileName }: { fileName: string }) =>
    createElement("button", { type: "button" }, `Hapus ${fileName}`),
}));

vi.mock("~/app/dashboard/_components/initials-avatar", () => ({
  InitialsAvatar: ({ alt }: { alt: string }) => createElement("img", { alt }),
}));

vi.mock("~/app/dashboard/_components/completeness-badge", () => ({
  CompletenessBadge: ({ score }: { score: number }) =>
    createElement("div", null, `CompletenessBadge:${score}`),
}));

import { ResidentDetailView } from "~/app/dashboard/_components/resident-detail-view";

describe("ResidentDetailView", () => {
  it("renders grouped resident detail sections with a compact supporting sidebar", () => {
    render(
      createElement(ResidentDetailView, {
        resident: {
          id: "resident-1",
          namaLengkap: "Budi Santoso",
          nik: "3201010101010101",
          hubunganDalamKk: "Anak",
          isActive: true,
          isKepalaKeluarga: false,
          jenisKelamin: "Laki-laki",
          statusPerkawinan: "Belum Kawin",
          tempatLahir: "Bandung",
          tanggalLahir: new Date("1990-01-01T00:00:00.000Z"),
          agama: "Islam",
          pendidikan: "SMA",
          pekerjaan: "Wiraswasta",
          household: {
            id: "household-1",
            noKk: "3201010101010102",
            alamat: "Jl. Kenanga 1",
            rt: "001",
            rw: "002",
          },
        },
        completeness: {
          status: "warning",
          score: 70,
          missing: ["Agama", "Pekerjaan"],
        },
        files: [
          {
            id: "file-1",
            fileName: "ktp.pdf",
            size: 2048,
            mimeType: "application/pdf",
            createdAt: new Date("2024-01-10T00:00:00.000Z"),
            downloadUrl: "https://example.com/ktp.pdf",
          },
          {
            id: "file-2",
            fileName: "kk.pdf",
            size: 1024 * 1024,
            mimeType: "application/pdf",
            createdAt: new Date("2024-01-11T00:00:00.000Z"),
            downloadUrl: "https://example.com/kk.pdf",
          },
        ],
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Budi Santoso" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("NIK")).toHaveLength(2);
    expect(screen.getAllByText("3201010101010101")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /buka kk/i }),
    ).toHaveAttribute("href", "/dashboard/kk/household-1");
    expect(
      screen.getByRole("link", { name: /edit warga/i }),
    ).toHaveAttribute("href", "/dashboard/warga/resident-1/edit");

    expect(
      screen.getByRole("heading", { name: "Identitas Dasar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Data Sosial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Konteks Keluarga" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jenis kelamin")).toBeInTheDocument();
    expect(screen.getByText("Nomor KK")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Kelengkapan Data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 field belum diisi")).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Agama");
    expect(screen.getByRole("list")).toHaveTextContent("Pekerjaan");

    expect(
      screen.getByRole("heading", { name: "Dokumen Warga" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DocumentUploader:resident-1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /buka dokumen ktp.pdf/i }),
    ).toHaveAttribute("href", "https://example.com/ktp.pdf");
    expect(
      screen.getByRole("link", { name: /buka dokumen kk.pdf/i }),
    ).toHaveAttribute(
      "href",
      "https://example.com/kk.pdf",
    );
    expect(screen.getByText(/2.00 KB - application\/pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/1.00 MB - application\/pdf/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hapus ktp.pdf/i }),
    ).toBeInTheDocument();
  });

  it("renders the complete and empty-document states", () => {
    render(
      createElement(ResidentDetailView, {
        resident: {
          id: "resident-2",
          namaLengkap: "Ani",
          nik: "3201010101010111",
          hubunganDalamKk: "Istri",
          isActive: false,
          isKepalaKeluarga: true,
          jenisKelamin: "Perempuan",
          statusPerkawinan: "",
          tempatLahir: null,
          tanggalLahir: null,
          agama: "",
          pendidikan: "",
          pekerjaan: "",
          household: {
            id: "household-2",
            noKk: "3201010101010112",
            alamat: "Jl. Melati 2",
            rt: "003",
            rw: "004",
          },
        },
        completeness: {
          status: "complete",
          score: 100,
          missing: [],
        },
        files: [],
      }),
    );

    expect(screen.getAllByText("Belum diisi").length).toBeGreaterThan(0);
    expect(screen.getByText("Semua field inti sudah terisi")).toBeInTheDocument();
    expect(screen.getByText("Data warga sudah lengkap.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada dokumen warga.")).toBeInTheDocument();
  });

  it("hides the document-open link when a file has no download url", () => {
    render(
      createElement(ResidentDetailView, {
        resident: {
          id: "resident-3",
          namaLengkap: "Rani",
          nik: "3201010101010113",
          hubunganDalamKk: "Anak",
          isActive: true,
          isKepalaKeluarga: false,
          jenisKelamin: "Perempuan",
          statusPerkawinan: "Belum Kawin",
          tempatLahir: "Bandung",
          tanggalLahir: new Date("2001-01-01T00:00:00.000Z"),
          agama: "Islam",
          pendidikan: "SMA",
          pekerjaan: "Pelajar/Mahasiswa",
          household: {
            id: "household-3",
            noKk: "3201010101010114",
            alamat: "Jl. Nusa 3",
            rt: "005",
            rw: "006",
          },
        },
        completeness: {
          status: "complete",
          score: 100,
          missing: [],
        },
        files: [
          {
            id: "file-2",
            fileName: "surat.pdf",
            size: 1024,
            mimeType: "application/pdf",
            createdAt: new Date("2024-02-10T00:00:00.000Z"),
            downloadUrl: null,
          },
        ],
      }),
    );

    expect(screen.queryByRole("link", { name: /buka dokumen/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /hapus surat.pdf/i }),
    ).toBeInTheDocument();
  });
});
