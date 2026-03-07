import { ArrowRight, Database, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FadeIn } from "~/components/animated/fade-in";
import { auth } from "~/server/auth";

import { LoginForm } from "./login-form";

const highlights = [
  {
    title: "Pendataan Terstruktur",
    description:
      "Data kartu keluarga dan anggota tersimpan rapi, mudah dicari, dan konsisten.",
    icon: Database,
  },
  {
    title: "Akses Aman",
    description:
      "Setiap perubahan tercatat berdasarkan akun petugas untuk menjaga akurasi.",
    icon: ShieldCheck,
  },
  {
    title: "Fokus Layanan",
    description:
      "Alur kerja didesain cepat untuk membantu pelayanan warga setiap hari.",
    icon: Users,
  },
];

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(90%_90%_at_50%_10%,oklch(0.95_0.05_190),transparent_60%),linear-gradient(180deg,oklch(0.99_0.01_210),oklch(0.98_0.02_180))] px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1.2fr_1fr]">
        <FadeIn>
          <Card className="border-border/70 bg-background/85 shadow-lg backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-2">
              <Badge className="w-fit rounded-full" variant="secondary">
                WargaKu
              </Badge>
              <CardTitle className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
                Pendataan warga yang cepat, rapi, dan ramah petugas.
              </CardTitle>
              <CardDescription className="text-base">
                Kelola data kartu keluarga, anggota, dan dokumen foto dalam satu
                dashboard terintegrasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {highlights.map((item, index) => (
                <FadeIn
                  key={item.title}
                  delay={index * 0.06}
                  className="bg-muted/45 flex items-start gap-3 rounded-2xl border p-4"
                >
                  <div className="bg-background flex size-9 items-center justify-center rounded-xl border">
                    <item.icon className="text-primary size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Card className="border-border/80 bg-background/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Masuk</CardTitle>
              <CardDescription>
                Gunakan akun petugas untuk akses dashboard pendataan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <ArrowRight className="size-3" />
                Hubungi admin jika membutuhkan reset password.
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </main>
  );
}
