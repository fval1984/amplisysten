"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ADMIN_EMAIL } from "@/lib/constants";
import Button from "@/components/ui/Button";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ?? null;

      if (!currentUser) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (currentUser.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        router.replace("/login?error=not_allowed");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (!nextUser) {
          router.replace("/login");
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <span className="text-sm text-zinc-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="w-64 border-r border-zinc-200 bg-white px-4 py-6">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">Amplipátio</h1>
          <p className="text-xs text-zinc-500">{user?.email}</p>
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
          <Button variant="ghost" onClick={handleSignOut}>
            Sair
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
