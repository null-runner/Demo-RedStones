import "@/lib/env";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/server/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedStones CRM",
  description: "Mini CRM per la gestione contatti, aziende e pipeline commerciale",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
