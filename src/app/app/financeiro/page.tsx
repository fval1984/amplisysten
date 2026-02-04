"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  AccountPayable,
  AccountReceivable,
  CashLedger,
  Settings,
  Vehicle,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type PayableForm = {
  type: string;
  description: string;
  amount: string;
  due_date: string;
};

const emptyPayableForm: PayableForm = {
  type: "única",
  description: "",
  amount: "",
  due_date: "",
};

const tabs = [
  { key: "receber", label: "Contas a receber" },
  { key: "pagar", label: "Contas a pagar" },
  { key: "caixa", label: "Caixa" },
  { key: "hist-receber", label: "Histórico contas a receber" },
  { key: "hist-pagar", label: "Histórico contas a pagar" },
];

type TabKey = (typeof tabs)[number]["key"];

export default function FinanceiroPage() {
  const [tab, setTab] = useState<TabKey>("receber");
  const searchParams = useSearchParams();
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [ledger, setLedger] = useState<CashLedger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [payableModalOpen, setPayableModalOpen] = useState(false);
  const [payableForm, setPayableForm] =
    useState<PayableForm>(emptyPayableForm);

  const [billModal, setBillModal] = useState<AccountReceivable | null>(null);
  const [invoiceModal, setInvoiceModal] =
    useState<AccountReceivable | null>(null);
  const [confirmReceivableModal, setConfirmReceivableModal] =
    useState<AccountReceivable | null>(null);
  const [confirmPayableModal, setConfirmPayableModal] =
    useState<AccountPayable | null>(null);

  const fetchData = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: receivableData } = await supabase
      .from("accounts_receivable")
      .select("*")
      .order("due_date", { ascending: true });
    const { data: payableData } = await supabase
      .from("accounts_payable")
      .select("*")
      .order("due_date", { ascending: true });
    const { data: ledgerData } = await supabase
      .from("cash_ledger")
      .select("*")
      .order("occurred_at", { ascending: false });
    const { data: vehicleData } = await supabase.from("vehicles").select("*");
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .maybeSingle();

    setReceivables((receivableData ?? []) as AccountReceivable[]);
    setPayables((payableData ?? []) as AccountPayable[]);
    setLedger((ledgerData ?? []) as CashLedger[]);
    setVehicles((vehicleData ?? []) as Vehicle[]);
    setSettings((settingsData ?? null) as Settings | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabKey | null;
    if (tabParam && tabs.some((item) => item.key === tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);

  const vehicleMap = useMemo(() => {
    return vehicles.reduce<Record<string, Vehicle>>((acc, vehicle) => {
      acc[vehicle.id] = vehicle;
      return acc;
    }, {});
  }, [vehicles]);

  const openReceivables = receivables.filter(
    (receivable) => receivable.status === "ABERTO"
  );
  const openPayables = payables.filter((payable) => payable.status === "ABERTO");
  const historyReceivables = receivables.filter(
    (receivable) => receivable.status === "PAGO"
  );
  const historyPayables = payables.filter((payable) => payable.status === "PAGO");

  const ledgerBalance = ledger.reduce((acc, entry) => {
    return entry.type === "ENTRADA"
      ? acc + Number(entry.amount)
      : acc - Number(entry.amount);
  }, 0);

  const handleCreatePayable = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("accounts_payable").insert({
      type: payableForm.type,
      description: payableForm.description,
      amount: Number(payableForm.amount),
      due_date: payableForm.due_date,
      status: "ABERTO",
    });
    setPayableModalOpen(false);
    setPayableForm(emptyPayableForm);
    await fetchData();
  };

  const markReceivablePaid = async () => {
    if (!confirmReceivableModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("accounts_receivable")
      .update({ status: "PAGO", paid_at: new Date().toISOString() })
      .eq("id", confirmReceivableModal.id);
    await supabase.from("cash_ledger").insert({
      type: "ENTRADA",
      amount: confirmReceivableModal.amount,
      description: `Recebimento ${confirmReceivableModal.payer_name}`,
      source: "accounts_receivable",
    });
    setConfirmReceivableModal(null);
    await fetchData();
  };

  const markPayablePaid = async () => {
    if (!confirmPayableModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("accounts_payable")
      .update({ status: "PAGO", paid_at: new Date().toISOString() })
      .eq("id", confirmPayableModal.id);
    await supabase.from("cash_ledger").insert({
      type: "SAIDA",
      amount: confirmPayableModal.amount,
      description: `Pagamento ${confirmPayableModal.description}`,
      source: "accounts_payable",
    });
    setConfirmPayableModal(null);
    await fetchData();
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">Carregando...</div>;
  }

  const canCreatePayable =
    payableForm.description.trim() !== "" &&
    payableForm.amount.trim() !== "" &&
    payableForm.due_date.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Financeiro</h2>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`rounded-md px-3 py-2 text-sm ${
              tab === item.key
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "receber" ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Pagador</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {openReceivables.map((receivable) => (
                <tr key={receivable.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium">
                    {receivable.vehicle_id
                      ? vehicleMap[receivable.vehicle_id]?.plate ?? "-"
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{receivable.payer_name}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(Number(receivable.amount))}
                  </td>
                  <td className="px-4 py-3">{formatDate(receivable.due_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setBillModal(receivable)}
                      >
                        Gerar cobrança
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setInvoiceModal(receivable)}
                      >
                        Gerar nota fiscal
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmReceivableModal(receivable)}
                      >
                        Pagamento efetuado
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {openReceivables.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    Nenhuma conta a receber em aberto.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "pagar" ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setPayableModalOpen(true)}>
              Nova despesa
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {openPayables.map((payable) => (
                  <tr key={payable.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-medium">
                      {payable.description}
                    </td>
                    <td className="px-4 py-3">{payable.type ?? "-"}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(Number(payable.amount))}
                    </td>
                    <td className="px-4 py-3">{formatDate(payable.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmPayableModal(payable)}
                        >
                          Pagamento efetuado
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {openPayables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      Nenhuma conta a pagar em aberto.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "caixa" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm text-zinc-500">Saldo atual</h3>
            <p className="text-2xl font-semibold">
              {formatCurrency(ledgerBalance)}
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3">{entry.type}</td>
                    <td className="px-4 py-3">{entry.description ?? "-"}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(Number(entry.amount))}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(entry.occurred_at)}
                    </td>
                  </tr>
                ))}
                {ledger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      Nenhum lançamento no caixa.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "hist-receber" ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Pagador</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {historyReceivables.map((receivable) => (
                <tr key={receivable.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium">
                    {receivable.vehicle_id
                      ? vehicleMap[receivable.vehicle_id]?.plate ?? "-"
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{receivable.payer_name}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(Number(receivable.amount))}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(receivable.paid_at)}
                  </td>
                </tr>
              ))}
              {historyReceivables.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    Nenhum pagamento registrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "hist-pagar" ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {historyPayables.map((payable) => (
                <tr key={payable.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium">
                    {payable.description}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(Number(payable.amount))}
                  </td>
                  <td className="px-4 py-3">{formatDate(payable.paid_at)}</td>
                </tr>
              ))}
              {historyPayables.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    Nenhuma despesa paga registrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        title="Nova despesa"
        isOpen={payableModalOpen}
        onClose={() => setPayableModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayableModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayable} disabled={!canCreatePayable}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-zinc-600">Tipo</label>
            <Select
              value={payableForm.type}
              onChange={(event) =>
                setPayableForm({ ...payableForm, type: event.target.value })
              }
            >
              <option value="única">única</option>
              <option value="recorrente">recorrente</option>
              <option value="parcelada">parcelada</option>
            </Select>
          </div>
          <div>
            <label className="text-sm text-zinc-600">Vencimento</label>
            <Input
              type="date"
              value={payableForm.due_date}
              onChange={(event) =>
                setPayableForm({ ...payableForm, due_date: event.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-zinc-600">Descrição</label>
            <Textarea
              value={payableForm.description}
              onChange={(event) =>
                setPayableForm({
                  ...payableForm,
                  description: event.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Valor</label>
            <Input
              type="number"
              value={payableForm.amount}
              onChange={(event) =>
                setPayableForm({ ...payableForm, amount: event.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Gerar cobrança"
        isOpen={!!billModal}
        onClose={() => setBillModal(null)}
        footer={<Button onClick={() => setBillModal(null)}>Fechar</Button>}
      >
        {billModal ? (
          <div className="flex flex-col gap-3 text-sm text-zinc-600">
            <div>
              <strong>Veículo:</strong>{" "}
              {billModal.vehicle_id
                ? vehicleMap[billModal.vehicle_id]?.plate ?? "-"
                : "-"}
            </div>
            <div>
              <strong>Pagador:</strong> {billModal.payer_name}
            </div>
            <div>
              <strong>Valor:</strong>{" "}
              {formatCurrency(Number(billModal.amount))}
            </div>
            <div>
              <strong>Vencimento:</strong> {formatDate(billModal.due_date)}
            </div>
            <div>
              <strong>Dados bancários:</strong>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
                {settings?.bank_details ?? "Configurar em Configurações."}
              </pre>
            </div>
            <div>
              <strong>Texto cobrança:</strong>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
                {settings?.template_billing ?? "Configurar em Configurações."}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Gerar nota fiscal"
        isOpen={!!invoiceModal}
        onClose={() => setInvoiceModal(null)}
        footer={<Button onClick={() => setInvoiceModal(null)}>Fechar</Button>}
      >
        {invoiceModal ? (
          <div className="flex flex-col gap-3 text-sm text-zinc-600">
            <div>
              <strong>Veículo:</strong>{" "}
              {invoiceModal.vehicle_id
                ? vehicleMap[invoiceModal.vehicle_id]?.plate ?? "-"
                : "-"}
            </div>
            <div>
              <strong>Valor:</strong>{" "}
              {formatCurrency(Number(invoiceModal.amount))}
            </div>
            <div>
              <strong>Texto nota fiscal:</strong>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
                {settings?.template_invoice ?? "Configurar em Configurações."}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Confirmar pagamento"
        isOpen={!!confirmReceivableModal}
        onClose={() => setConfirmReceivableModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmReceivableModal(null)}
            >
              Cancelar
            </Button>
            <Button onClick={markReceivablePaid}>Confirmar</Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Confirmar pagamento de{" "}
          {confirmReceivableModal
            ? formatCurrency(Number(confirmReceivableModal.amount))
            : ""}
          ?
        </p>
      </Modal>

      <Modal
        title="Confirmar pagamento"
        isOpen={!!confirmPayableModal}
        onClose={() => setConfirmPayableModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmPayableModal(null)}
            >
              Cancelar
            </Button>
            <Button onClick={markPayablePaid}>Confirmar</Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Confirmar pagamento de{" "}
          {confirmPayableModal
            ? formatCurrency(Number(confirmPayableModal.amount))
            : ""}
          ?
        </p>
      </Modal>
    </div>
  );
}
