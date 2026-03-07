import { redirect } from "next/navigation";
import { CircleDot, LogOut } from "lucide-react";

import { DashboardNav } from "~/app/dashboard/_components/dashboard-nav";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { auth, signOut } from "~/server/auth";
import { db } from "~/server/db";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, dbState] = await Promise.all([
    auth(),
    db
      .$queryRawUnsafe("SELECT 1")
      .then(() => "online" as const)
      .catch(() => "offline" as const),
  ]);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.97_0.04_185),transparent_45%),linear-gradient(180deg,oklch(0.99_0.01_210),oklch(0.98_0.02_180))]">
      <header className="bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold tracking-wide">WargaKu</p>
            <p className="text-muted-foreground text-xs">
              Sistem pendataan warga
            </p>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Badge variant="secondary" className="gap-1.5 rounded-full">
              <CircleDot className="size-3 text-emerald-500" />
              Session Aktif
            </Badge>
            <Badge
              variant={dbState === "online" ? "secondary" : "outline"}
              className="gap-1.5 rounded-full"
            >
              <CircleDot
                className={`size-3 ${dbState === "online" ? "text-emerald-500" : "text-red-500"}`}
              />
              {dbState === "online" ? "DB Online" : "DB Bermasalah"}
            </Badge>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <DashboardNav orientation="horizontal" />
          </nav>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <LogOut className="size-4" />
              Keluar
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="bg-background/80 hidden h-fit min-w-60 rounded-2xl border p-3 md:block">
          <div className="px-2 pb-2">
            <p className="text-sm font-medium">
              {session.user.name ?? "Admin"}
            </p>
            <p className="text-muted-foreground text-xs">
              @{session.user.id.slice(0, 8)}
            </p>
          </div>
          <Separator className="mb-2" />
          <div className="space-y-1">
            <DashboardNav orientation="vertical" />
          </div>
        </aside>

        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
