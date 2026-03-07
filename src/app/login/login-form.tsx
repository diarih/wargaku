"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        toast.error("Username atau password tidak valid.");
        return;
      }

      if (result?.ok) {
        toast.success("Login berhasil. Selamat datang!");
        if (result.url) {
          window.location.assign(result.url);
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.error("Tidak dapat menyelesaikan login. Coba lagi.");
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <UserRound className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            id="username"
            placeholder="Masukkan username"
            autoComplete="username"
            className="h-10 pl-9"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            autoComplete="current-password"
            className="h-10 px-9"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((state) => !state)}
            className="text-muted-foreground absolute top-2.5 right-3"
            aria-label={
              showPassword ? "Sembunyikan password" : "Lihat password"
            }
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? "Memproses..." : "Masuk ke Dashboard"}
      </Button>
    </form>
  );
}
