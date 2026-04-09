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

import { DocumentUploader } from "~/app/dashboard/_components/document-uploader";

describe("DocumentUploader", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows an error when no file is selected", async () => {
    const user = userEvent.setup();
    render(createElement(DocumentUploader, { householdId: "household-1" }));

    await user.click(screen.getByRole("button", { name: /upload berkas/i }));

    expect(toastErrorMock).toHaveBeenCalledWith("Pilih file terlebih dahulu.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads the selected file and refreshes the page", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    const user = userEvent.setup();
    const { container } = render(
      createElement(DocumentUploader, { householdId: "household-1" }),
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    const file = new File(["hello"], "kk.pdf", { type: "application/pdf" });

    expect(input).not.toBeNull();
    await user.upload(input!, file);
    await user.click(screen.getByRole("button", { name: /upload berkas/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/storage/upload", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Berkas kk.pdf berhasil diunggah.",
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows the backend error when upload fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "R2 sedang bermasalah." }),
    });
    const user = userEvent.setup();
    const { container } = render(
      createElement(DocumentUploader, { residentId: "resident-1" }),
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    await user.upload(
      input!,
      new File(["hello"], "warga.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: /upload berkas/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("R2 sedang bermasalah.");
    });
  });
});
