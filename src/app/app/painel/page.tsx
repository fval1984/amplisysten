"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AccountPayable, CashLedger, Vehicle } from "@/lib/types";
import { daysInPatio, formatCurrency, sum } from "@/lib/utils";

export default function PainelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [ledger, setLedger] = useState<CashLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*");
      const { data: payablesData } = await supabase
        .from("accounts_payable")
        .select("*")
        .eq("status", "ABERTO");
      const { data: ledgerData } = await supabase
        .from("cash_ledger")
        .select("*");

      setVehicles((vehiclesData ?? []) as Vehicle[]);
      setPayables((payablesData ?? []) as AccountPayable[]);
      setLedger((ledgerData ?? []) as CashLedger[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const activeVehicles = vehicles.filter(
      (vehicle) => vehicle.status !== "REMOVIDO"
    );
    const valueNow = sum(
      activeVehicles.map((vehicle) =>
        daysInPatio(vehicle.entry_at) * Number(vehicle.daily_rate)
      )
    );
    const releaseRequested = vehicles.filter(
      (vehicle) => vehicle.status === "LIBERACAO_SOLICITADA"
    ).length;
    const releaseConfirmed = vehicles.filter(
      (vehicle) => vehicle.status === "LIBERACAO_CONFIRMADA"
    ).length;

    const today = new Date();
    const isSameDay = (dateValue: string) => {
      const due = new Date(`${dateValue}T00:00:00`);
      return (
        due.getFullYear() === today.getFullYear() &&
        due.getMonth() === today.getMonth() &&
        due.getDate() === today.getDate()
      );
    };

    const overduePayables = payables.filter((payable) => {
      const due = new Date(`${payable.due_date}T00:00:00`);
      return due < new Date(today.toDateString());
    }).length;

    const dueTodayPayables = payables.filter((payable) =>
      isSameDay(payable.due_date)
    ).length;

    const ledgerBalance = sum(
      ledger.map((entry) =>
        entry.type === "ENTRADA"
          ? Number(entry.amount)
          : -Number(entry.amount)
      )
    );

    return {
      vehiclesInPatio: vehicles.filter((v) => v.status === "NO_PATIO").length,
      activeVehicles: activeVehicles.length,
      valueNow,
      releaseRequested,
      releaseConfirmed,
      overduePayables,
      dueTodayPayables,
      ledgerBalance,
    };
  }, [ledger, payables, vehicles]);

  if (loading) {
    return <div className="text-sm text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Painel</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Veículos no pátio"
          subtitle={`${metrics.vehiclesInPatio} veículos`}
          onClick={() => router.push("/app/gestao-patio?tab=NO_PATIO")}
        >
          <p className="text-sm text-zinc-500">
            Valor gerado agora: {formatCurrency(metrics.valueNow)}
          </p>
        </Card>
        <Card
          title="Veículos ativos"
          subtitle={`${metrics.activeVehicles} veículos`}
          onClick={() => router.push("/app/gestao-patio")}
        />
        <Card
          title="Liberações solicitadas"
          subtitle={`${metrics.releaseRequested}`}
          onClick={() =>
            router.push("/app/gestao-patio?tab=LIBERACAO_SOLICITADA")
          }
        />
        <Card
          title="Liberação confirmada"
          subtitle={`${metrics.releaseConfirmed}`}
          onClick={() =>
            router.push("/app/gestao-patio?tab=LIBERACAO_CONFIRMADA")
          }
        />
        <Card
          title="Contas vencidas"
          subtitle={`${metrics.overduePayables}`}
          onClick={() => router.push("/app/financeiro?tab=pagar")}
        />
        <Card
          title="Dia de pagar"
          subtitle={`${metrics.dueTodayPayables}`}
          onClick={() => router.push("/app/financeiro?tab=pagar")}
        />
        <Card
          title="Caixa (saldo)"
          subtitle={formatCurrency(metrics.ledgerBalance)}
          onClick={() => router.push("/app/financeiro?tab=caixa")}
        />
      </div>
    </div>
  );
}
