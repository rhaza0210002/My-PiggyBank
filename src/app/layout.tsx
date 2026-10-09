import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Luciole : police conçue avec des personnes malvoyantes (licence CC BY 4.0, voir la page Accessibilité).
const luciole = localFont({
  src: [
    { path: "./fonts/Luciole-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Luciole-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-luciole",
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
    <html lang="fr" className={`${luciole.variable} h-full antialiased`} suppressHydrationWarning>
      <body className={`${luciole.className} min-h-full flex flex-col bg-fond text-texte`}>
        {children}
      </body>
    </html>
  );
}
