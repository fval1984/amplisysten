"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/app/painel", label: "Painel" },
  { href: "/app/gestao-patio", label: "Gestão de Pátio" },
  { href: "/app/parceiros", label: "Parceiros" },
  { href: "/app/financeiro", label: "Financeiro" },
  { href: "/app/configuracoes", label: "Configurações" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="w-64 border-r border-zinc-200 bg-white px-4 py-6">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Amplipátio</h1>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
          <span className="text-sm text-zinc-500">{pathname}</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
