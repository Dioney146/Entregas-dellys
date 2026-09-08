import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Controle de Entregas Delly's",
  description: "Cronograma e acompanhamento de entregas fluviais e rodoviárias",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-700/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
            <h1 className="text-lg font-semibold font-display tracking-tight">
              Controle de Entregas — Delly&apos;s
            </h1>
            <nav className="flex gap-5 text-sm text-slate-300">
              <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/entregas" className="hover:text-white transition-colors">Entregas</Link>
              <Link href="/cronograma" className="hover:text-white transition-colors">Cronograma</Link>
            </nav>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
