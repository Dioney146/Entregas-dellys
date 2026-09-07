import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Controle de Entregas Delly's",
  description: "Cronograma e acompanhamento de entregas fluviais e rodoviárias",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Controle de Entregas — Delly&apos;s</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-sky-400">Dashboard</Link>
              <Link href="/entregas" className="hover:text-sky-400">Entregas</Link>
              <Link href="/cronograma" className="hover:text-sky-400">Cronograma</Link>
            </nav>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
