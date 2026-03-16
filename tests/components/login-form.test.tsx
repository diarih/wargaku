import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "~/app/login/login-form";

const { pushMock, refreshMock, signInMock, toastSuccessMock, toastErrorMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    signInMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("shows an error toast when credentials are rejected", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    const user = userEvent.setup();

    render(createElement(LoginForm));

    await user.type(screen.getByLabelText("Username"), "petugas");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(
      screen.getByRole("button", { name: "Masuk ke Dashboard" }),
    );

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("credentials", {
        username: "petugas",
        password: "wrong-password",
        redirect: false,
        callbackUrl: "/dashboard",
      });
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Username atau password tidak valid.",
      );
    });
  });

  it("navigates to the dashboard after a successful login", async () => {
    signInMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(createElement(LoginForm));

    await user.type(screen.getByLabelText("Username"), "petugas");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(
      screen.getByRole("button", { name: "Masuk ke Dashboard" }),
    );

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Login berhasil. Selamat datang!",
      );
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("toggles the password visibility", async () => {
    const user = userEvent.setup();
    render(createElement(LoginForm));

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Lihat password" }));
    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
