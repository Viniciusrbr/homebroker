import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Homebroker Invest",
  description: "Negocie ativos em tempo real",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "dark h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        instrumentSerif.variable,
      )}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Suspense>
          <Navbar />
        </Suspense>
        <main className="mx-auto flex w-full max-w-7xl grow flex-col px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
