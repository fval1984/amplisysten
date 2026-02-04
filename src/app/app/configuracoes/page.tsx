"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Settings } from "@/lib/types";

type SettingsForm = {
  company_name: string;
  cnpj: string;
  bank_details: string;
  template_billing: string;
  template_invoice: string;
};

const emptySettingsForm: SettingsForm = {
  company_name: "",
  cnpj: "",
  bank_details: "",
  template_billing: "",
  template_invoice: "",
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<SettingsForm>(emptySettingsForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("settings").select("*").maybeSingle();
    if (data) {
      const settings = data as Settings;
      setForm({
        company_name: settings.company_name ?? "",
        cnpj: settings.cnpj ?? "",
        bank_details: settings.bank_details ?? "",
        template_billing: settings.template_billing ?? "",
        template_invoice: settings.template_invoice ?? "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    await supabase.from("settings").upsert(
      {
        user_id: authData.user.id,
        company_name: form.company_name || null,
        cnpj: form.cnpj || null,
        bank_details: form.bank_details || null,
        template_billing: form.template_billing || null,
        template_invoice: form.template_invoice || null,
      },
      { onConflict: "user_id" }
    );
    setMessage("Configurações salvas com sucesso.");
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Configurações</h2>
        <Button onClick={handleSave}>Salvar</Button>
      </div>

      {message ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-zinc-600">Nome do pátio/empresa</label>
          <Input
            value={form.company_name}
            onChange={(event) =>
              setForm({ ...form, company_name: event.target.value })
            }
          />
        </div>
        <div>
          <label className="text-sm text-zinc-600">CNPJ</label>
          <Input
            value={form.cnpj}
            onChange={(event) => setForm({ ...form, cnpj: event.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600">Dados bancários</label>
          <Textarea
            value={form.bank_details}
            onChange={(event) =>
              setForm({ ...form, bank_details: event.target.value })
            }
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600">Texto template cobrança</label>
          <Textarea
            value={form.template_billing}
            onChange={(event) =>
              setForm({ ...form, template_billing: event.target.value })
            }
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-600">Texto template nota fiscal</label>
          <Textarea
            value={form.template_invoice}
            onChange={(event) =>
              setForm({ ...form, template_invoice: event.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
