import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  pushMock,
  refreshMock,
  backMock,
  toastSuccessMock,
  toastErrorMock,
  fetchMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  backMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
    back: backMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

import { ResidentForm } from "~/app/dashboard/_components/resident-form";

describe("ResidentForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    backMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Nama Lengkap"), "Budi Santoso");
    await user.type(screen.getByLabelText("NIK"), "3201010101010102");
    await user.selectOptions(
      screen.getByLabelText("Jenis Kelamin"),
      "Laki-laki",
    );
    await user.type(screen.getByLabelText("Tempat Lahir"), "Bandung");
    await user.type(screen.getByLabelText("Tanggal Lahir"), "1990-01-01");
    await user.selectOptions(
      screen.getByLabelText("Hubungan Dalam KK"),
      "Anak",
    );
  }

  it("resets the form when saving and adding another resident", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const user = userEvent.setup();

    render(
      createElement(ResidentForm, {
        mode: "create",
        householdId: "household-1",
        householdLabel: "3201",
      }),
    );

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: /simpan & tambah lagi/i }),
    );

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Anggota keluarga berhasil ditambahkan. Lanjutkan tambah data berikutnya.",
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows a confirmation modal when changing the head of family", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue({ redirectTo: "/dashboard/kk/household-1" }),
    });
    const user = userEvent.setup();

    render(
      createElement(ResidentForm, {
        mode: "create",
        householdId: "household-1",
        householdLabel: "3201",
        currentHead: { id: "resident-1", namaLengkap: "Ibu Siti" },
      }),
    );

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText(/jadikan kepala keluarga/i));
    await user.click(screen.getByRole("button", { name: /simpan & selesai/i }));

    expect(
      screen.getByText(/kepala keluarga akan diganti/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /lanjutkan/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
      expect(pushMock).toHaveBeenCalledWith("/dashboard/kk/household-1");
    });
  });
});
