import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: { default: "My PiggyBank", template: "%s | My PiggyBank" },
  description: "Suivi budgétaire et rapprochement bancaire",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "PiggyBank", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#8fd36f" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full antialiased`} suppressHydrationWarning>
      <body className={`${montserrat.className} min-h-full flex flex-col bg-[#f5efe8] text-[#5b473d]`}>
        {children}
      </body>
    </html>
  );
}
