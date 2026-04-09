import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { refreshMock, toastSuccessMock, toastErrorMock, fetchMock } = vi.hoisted(
  () => ({
    refreshMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
    fetchMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

import { FileDeleteButton } from "~/app/dashboard/_components/file-delete-button";

describe("FileDeleteButton", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    render(
      createElement(FileDeleteButton, { fileId: "file-1", fileName: "kk.pdf" }),
    );

    await user.click(screen.getByRole("button", { name: /^hapus$/i }));

    expect(
      screen.getByText(/hapus permanen dari penyimpanan/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes the file after confirmation", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const user = userEvent.setup();
    render(
      createElement(FileDeleteButton, { fileId: "file-1", fileName: "kk.pdf" }),
    );

    await user.click(screen.getByRole("button", { name: /^hapus$/i }));
    await user.click(screen.getByRole("button", { name: /ya, hapus/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/storage/file-1", {
        method: "DELETE",
      });
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Berkas kk.pdf berhasil dihapus.",
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows an error toast when delete fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Gagal hapus di R2." }),
    });
    const user = userEvent.setup();
    render(
      createElement(FileDeleteButton, {
        fileId: "file-2",
        fileName: "foto.png",
      }),
    );

    await user.click(screen.getByRole("button", { name: /^hapus$/i }));
    await user.click(screen.getByRole("button", { name: /ya, hapus/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Gagal hapus di R2.");
    });
  });
});
