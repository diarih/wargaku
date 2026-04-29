import { createElement } from "react";
import { render, screen } from "@testing-library/react";

import type { ResidentDetailViewProps } from "~/app/dashboard/_components/resident-detail-view";

const {
  findUniqueMock,
  createSignedDownloadUrlMock,
  residentDetailViewMock,
  notFoundMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createSignedDownloadUrlMock: vi.fn(),
  residentDetailViewMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFoundMock();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("~/server/db", () => ({
  db: {
    resident: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("~/server/storage", () => ({
  createSignedDownloadUrl: createSignedDownloadUrlMock,
}));

vi.mock("~/app/dashboard/_components/resident-detail-view", () => ({
  ResidentDetailView: (props: ResidentDetailViewProps) => {
    residentDetailViewMock(props);

    return createElement(
      "div",
      null,
      `ResidentDetailView:${props.resident.id}:${props.completeness.status}:${props.files.length}`,
    );
  },
}));

describe("ResidentDetailPage", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createSignedDownloadUrlMock.mockReset();
    residentDetailViewMock.mockReset();
    notFoundMock.mockReset();
  });

  it("fetches the resident and passes computed detail props to the view", async () => {
    findUniqueMock.mockResolvedValue({
      id: "resident-1",
      namaLengkap: "Budi Santoso",
      nik: "3201010101010101",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Bandung",
      tanggalLahir: new Date("1990-01-01T00:00:00.000Z"),
      hubunganDalamKk: "Anak",
      isKepalaKeluarga: false,
      agama: null,
      pendidikan: "SMA",
      pekerjaan: null,
      statusPerkawinan: "Belum Kawin",
      isActive: true,
      household: {
        id: "household-1",
        noKk: "3201010101010102",
        alamat: "Jl. Kenanga 1",
        rt: "001",
        rw: "002",
      },
      files: [
        {
          id: "file-1",
          path: "resident-1/ktp.pdf",
          fileName: "ktp.pdf",
          size: 1024,
          mimeType: "application/pdf",
          createdAt: new Date("2024-01-10T00:00:00.000Z"),
        },
      ],
    });
    createSignedDownloadUrlMock.mockResolvedValue("https://example.com/ktp.pdf");

    const ResidentDetailPage = (
      await import("~/app/dashboard/warga/[id]/page")
    ).default;

    render(
      await ResidentDetailPage({
        params: Promise.resolve({ id: "resident-1" }),
      }),
    );

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "resident-1" },
      include: {
        household: {
          select: {
            id: true,
            noKk: true,
            alamat: true,
            rt: true,
            rw: true,
          },
        },
        files: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    expect(createSignedDownloadUrlMock).toHaveBeenCalledWith({
      key: "resident-1/ktp.pdf",
    });

    const viewProps = residentDetailViewMock.mock.calls[0]?.[0];

    expect(viewProps).toMatchObject({
      resident: expect.objectContaining({
        id: "resident-1",
        namaLengkap: "Budi Santoso",
      }),
      completeness: expect.objectContaining({
        status: "warning",
        score: expect.any(Number),
        missing: expect.arrayContaining(["Agama", "Pekerjaan"]),
      }),
      files: [
        expect.objectContaining({
          id: "file-1",
          downloadUrl: "https://example.com/ktp.pdf",
        }),
      ],
    });

    expect(
      screen.getByText("ResidentDetailView:resident-1:warning:1"),
    ).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("calls notFound when the resident does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const ResidentDetailPage = (
      await import("~/app/dashboard/warga/[id]/page")
    ).default;

    await expect(
      ResidentDetailPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(residentDetailViewMock).not.toHaveBeenCalled();
  });

  it("passes null download urls through when signed url generation fails", async () => {
    findUniqueMock.mockResolvedValue({
      id: "resident-2",
      namaLengkap: "Ani",
      nik: "3201010101010109",
      jenisKelamin: "Perempuan",
      tempatLahir: "Bandung",
      tanggalLahir: new Date("2000-01-01T00:00:00.000Z"),
      hubunganDalamKk: "Anak",
      isKepalaKeluarga: false,
      agama: "Islam",
      pendidikan: "SMA",
      pekerjaan: "Pelajar/Mahasiswa",
      statusPerkawinan: "Belum Kawin",
      isActive: true,
      household: {
        id: "household-2",
        noKk: "3201010101010110",
        alamat: "Jl. Mawar 2",
        rt: "001",
        rw: "002",
      },
      files: [
        {
          id: "file-2",
          path: "resident-2/kk.pdf",
          fileName: "kk.pdf",
          size: 1024,
          mimeType: "application/pdf",
          createdAt: new Date("2024-01-10T00:00:00.000Z"),
        },
      ],
    });
    createSignedDownloadUrlMock.mockRejectedValue(new Error("storage down"));

    const ResidentDetailPage = (
      await import("~/app/dashboard/warga/[id]/page")
    ).default;

    render(
      await ResidentDetailPage({
        params: Promise.resolve({ id: "resident-2" }),
      }),
    );

    const viewProps = residentDetailViewMock.mock.calls[0]?.[0] as
      | ResidentDetailViewProps
      | undefined;

    expect(viewProps?.files[0]?.downloadUrl).toBeNull();
    expect(
      screen.getByText("ResidentDetailView:resident-2:complete:1"),
    ).toBeInTheDocument();
  });
});
