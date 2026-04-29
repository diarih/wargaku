import { render, screen } from "@testing-library/react";

const { findUniqueMock, createSignedDownloadUrlMock, notFoundMock } =
  vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
    createSignedDownloadUrlMock: vi.fn(),
    notFoundMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFoundMock();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    <a href={String(href)} {...props}>
      {children}
    </a>,
}));

vi.mock("~/app/dashboard/_components/document-uploader", () => ({
  DocumentUploader: ({ householdId }: { householdId?: string }) => (
    <div>{`DocumentUploader:${householdId ?? ""}`}</div>
  ),
}));

vi.mock("~/app/dashboard/_components/file-delete-button", () => ({
  FileDeleteButton: ({ fileName }: { fileName: string }) => (
    <button type="button">{`Hapus ${fileName}`}</button>
  ),
}));

vi.mock("~/app/dashboard/_components/initials-avatar", () => ({
  InitialsAvatar: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("~/app/dashboard/_components/completeness-badge", () => ({
  CompletenessBadge: ({ score }: { score: number }) => (
    <div>{`CompletenessBadge:${score}`}</div>
  ),
}));

vi.mock("~/server/db", () => ({
  db: {
    household: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("~/server/storage", () => ({
  createSignedDownloadUrl: createSignedDownloadUrlMock,
}));

describe("HouseholdDetailPage", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createSignedDownloadUrlMock.mockReset();
    notFoundMock.mockReset();
  });

  it("renders new empty states for residents and household documents", async () => {
    findUniqueMock.mockResolvedValue({
      id: "household-1",
      noKk: "3201010101010101",
      kepalaKeluarga: "Budi",
      alamat: "Jl. Kenanga 1",
      rt: "001",
      rw: "002",
      kelurahan: "Cibiru",
      kecamatan: "Cibiru",
      kota: "Bandung",
      provinsi: "Jawa Barat",
      kodePos: null,
      phone: null,
      statusTempatTinggal: null,
      statusAktif: true,
      residents: [],
      files: [],
    });

    const HouseholdDetailPage = (await import("~/app/dashboard/kk/[id]/page"))
      .default;

    render(
      await HouseholdDetailPage({ params: Promise.resolve({ id: "household-1" }) }),
    );

    expect(screen.getByText(/belum ada anggota tercatat\./i)).toBeInTheDocument();
    expect(screen.getByText(/belum ada berkas terunggah\./i)).toBeInTheDocument();
  });

  it("hides household open links when signed urls cannot be created", async () => {
    findUniqueMock.mockResolvedValue({
      id: "household-1",
      noKk: "3201010101010101",
      kepalaKeluarga: "Budi",
      alamat: "Jl. Kenanga 1",
      rt: "001",
      rw: "002",
      kelurahan: "Cibiru",
      kecamatan: "Cibiru",
      kota: "Bandung",
      provinsi: "Jawa Barat",
      kodePos: null,
      phone: null,
      statusTempatTinggal: "Kontrak",
      statusAktif: true,
      residents: [
        {
          id: "resident-1",
          nik: "3201010101010102",
          namaLengkap: "Ani",
          jenisKelamin: "Perempuan",
          tempatLahir: "Bandung",
          tanggalLahir: new Date("2000-01-01T12:00:00.000Z"),
          hubunganDalamKk: "Anak",
          isKepalaKeluarga: true,
          agama: "Islam",
          pendidikan: "SMA/SMK/Sederajat",
          pekerjaan: "Pelajar/Mahasiswa",
          statusPerkawinan: "Belum Kawin",
          isActive: true,
        },
      ],
      files: [
        {
          id: "file-1",
          path: "household/1/kk.pdf",
          fileName: "kk.pdf",
          mimeType: "application/pdf",
          size: 1024,
          createdAt: new Date("2024-01-10T12:00:00.000Z"),
        },
      ],
    });
    createSignedDownloadUrlMock.mockRejectedValue(new Error("storage down"));

    const HouseholdDetailPage = (await import("~/app/dashboard/kk/[id]/page"))
      .default;

    render(
      await HouseholdDetailPage({ params: Promise.resolve({ id: "household-1" }) }),
    );

    expect(screen.queryByRole("link", { name: /buka dokumen/i })).toBeNull();
    expect(screen.getByRole("button", { name: /hapus kk.pdf/i })).toBeInTheDocument();
  });

  it("renders the reusable household file row when a signed url exists", async () => {
    findUniqueMock.mockResolvedValue({
      id: "household-1",
      noKk: "3201010101010101",
      kepalaKeluarga: "Budi",
      alamat: "Jl. Kenanga 1",
      rt: "001",
      rw: "002",
      kelurahan: "Cibiru",
      kecamatan: "Cibiru",
      kota: "Bandung",
      provinsi: "Jawa Barat",
      kodePos: null,
      phone: null,
      statusTempatTinggal: "Kontrak",
      statusAktif: true,
      residents: [
        {
          id: "resident-1",
          nik: "3201010101010102",
          namaLengkap: "Ani",
          jenisKelamin: "Perempuan",
          tempatLahir: "Bandung",
          tanggalLahir: new Date("2000-01-01T12:00:00.000Z"),
          hubunganDalamKk: "Anak",
          isKepalaKeluarga: true,
          agama: "Islam",
          pendidikan: "SMA/SMK/Sederajat",
          pekerjaan: "Pelajar/Mahasiswa",
          statusPerkawinan: "Belum Kawin",
          isActive: true,
        },
      ],
      files: [
        {
          id: "file-1",
          path: "household/1/kk.pdf",
          fileName: "kk.pdf",
          mimeType: "application/pdf",
          size: 2048,
          createdAt: new Date("2024-01-10T12:00:00.000Z"),
        },
      ],
    });
    createSignedDownloadUrlMock.mockResolvedValue("https://example.com/kk.pdf");

    const HouseholdDetailPage = (await import("~/app/dashboard/kk/[id]/page"))
      .default;

    render(
      await HouseholdDetailPage({ params: Promise.resolve({ id: "household-1" }) }),
    );

    expect(screen.getByText(/2.00 KB - application\/pdf/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /buka dokumen kk.pdf/i }),
    ).toHaveAttribute("href", "https://example.com/kk.pdf");
    expect(screen.getByRole("button", { name: /hapus kk.pdf/i })).toBeInTheDocument();
  });
});
