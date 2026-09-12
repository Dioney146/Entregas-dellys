import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "./components/sidebar";

export const dynamic = "force-dynamic";

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

const DIAS_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hoje = new Date();
  const dataFormatada = `${DIAS_SEMANA[hoje.getDay()]}, ${hoje.getDate()} de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-void)" }}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header
              className="h-16 flex items-center justify-end gap-4 px-6 border-b"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {dataFormatada}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--accent-brand)" }}
                >
                  DH
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Delly&apos;s Operacional
                </span>
              </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
