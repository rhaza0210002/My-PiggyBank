import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/features/header/Header";

// Configuration de la police Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "My PiggyBank",
  description: "Suivi de budget et rapprochements bancaires",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className={`${montserrat.className} antialiased bg-[#ebcfc6] text-[#5b473d]`}>
        <Header />
        {children}
      </body>
    </html>
  );
}