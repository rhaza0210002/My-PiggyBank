import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/features/header/Header";

export const metadata: Metadata = {
  title: "My Piggy Bank",
  description: "Suivi budgétaire et rapprochement bancaire",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f5efe8] text-[#5b473d]">
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
