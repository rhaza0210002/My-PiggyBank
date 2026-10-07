import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/features/header/Header";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "My Piggy Bank",
  description: "Suivi budgétaire et rapprochement bancaire",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full antialiased`} suppressHydrationWarning>
      <body className={`${montserrat.className} min-h-full flex flex-col bg-[#f5efe8] text-[#5b473d]`}>
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
