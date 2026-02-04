"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ADMIN_EMAIL } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") || "/app/painel";
  const error = searchParams.get("error");

  const handleNotAllowed = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMessage("Acesso não permitido.");
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setMessage(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user?.email !== ADMIN_EMAIL) {
      await handleNotAllowed();
      setLoading(false);
      return;
    }

    router.replace(next);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setMessage(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user?.email !== ADMIN_EMAIL) {
      await handleNotAllowed();
      setLoading(false);
      return;
    }

    router.replace(next);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Amplipátio</h1>
          <p className="text-sm text-zinc-500">
            Acesse sua conta para continuar.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-zinc-600">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@empresa.com"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error === "not_allowed" ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Acesso não permitido.
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {message}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Button onClick={handleSignIn} disabled={loading}>
              Entrar
            </Button>
            <Button
              variant="secondary"
              onClick={handleSignUp}
              disabled={loading}
            >
              Primeiro acesso (criar conta)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
