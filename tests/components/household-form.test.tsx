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

import { HouseholdForm } from "~/app/dashboard/_components/household-form";

describe("HouseholdForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    backMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits create payloads and redirects", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue({ redirectTo: "/dashboard/kk/household-1" }),
    });
    const user = userEvent.setup();

    render(createElement(HouseholdForm, { mode: "create" }));

    await user.type(screen.getByLabelText("Nomor KK"), "3201010101010101");
    await user.type(screen.getByLabelText("RT"), "01");
    await user.type(screen.getByLabelText("RW"), "02");
    await user.type(screen.getByLabelText("Alamat"), "Jalan Melati No. 17");
    await user.type(screen.getByLabelText("Kelurahan"), "Cibiru");
    await user.type(screen.getByLabelText("Kecamatan"), "Cibiru");
    await user.type(screen.getByLabelText("Kota / Kabupaten"), "Bandung");
    await user.type(screen.getByLabelText("Provinsi"), "Jawa Barat");
    await user.selectOptions(
      screen.getByLabelText("Status Tempat Tinggal"),
      "Kontrak",
    );
    await user.click(
      screen.getByRole("button", { name: /simpan & lanjut tambah anggota/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
      expect(pushMock).toHaveBeenCalledWith("/dashboard/kk/household-1");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows backend errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Nomor KK sudah digunakan." }),
    });
    const user = userEvent.setup();

    render(
      createElement(HouseholdForm, {
        mode: "edit",
        householdId: "household-1",
        initialValues: {
          noKk: "3201010101010101",
          alamat: "Jalan Melati No. 17",
          rt: "01",
          rw: "02",
          kelurahan: "Cibiru",
          kecamatan: "Cibiru",
          kota: "Bandung",
          provinsi: "Jawa Barat",
          kodePos: "40615",
          phone: "08123456789",
          statusTempatTinggal: "Kontrak",
          statusAktif: true,
        },
      }),
    );

    await user.click(screen.getByRole("button", { name: /perbarui kk/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Nomor KK sudah digunakan.");
    });
  });
});
