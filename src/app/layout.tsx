import "~/styles/globals.css";

import { type Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "WargaKu",
  description: "Sistem pendataan warga untuk kartu keluarga dan anggotanya.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-sans">
        <TRPCReactProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
