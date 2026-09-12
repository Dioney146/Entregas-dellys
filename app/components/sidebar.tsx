"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Route, Archive, FileBarChart } from "lucide-react";

const ITENS = [
  { href: "/", label: "Dashboard", Icone: LayoutDashboard },
  { href: "/entregas", label: "Entregas", Icone: Package },
  { href: "/cronograma", label: "Roteirização", Icone: Route },
  { href: "/arquivo", label: "Arquivo", Icone: Archive },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col" style={{ backgroundColor: "var(--sidebar-bg)" }}>
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/logo.webp" alt="Delly's" width={32} height={32} className="object-contain" />
        <div>
          <p className="text-white font-semibold font-display text-sm leading-tight">Delly&apos;s</p>
          <p className="text-[10px]" style={{ color: "var(--sidebar-text)" }}>Controle de Entregas</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {ITENS.map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: ativo ? "var(--sidebar-active-bg)" : "transparent",
                color: ativo ? "var(--accent-brand)" : "var(--sidebar-text)",
              }}
            >
              <item.Icone size={18} />
              {item.label}
            </Link>
          );
        })}

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm opacity-40 cursor-not-allowed"
          style={{ color: "var(--sidebar-text)" }}
          title="Em breve"
        >
          <FileBarChart size={18} />
          Relatórios
        </div>
      </nav>

      <div className="px-5 py-4 text-[11px]" style={{ color: "var(--sidebar-text)" }}>
        Delly&apos;s Food Service
      </div>
    </aside>
  );
}
