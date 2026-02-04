"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { AccountReceivable, Partner, Vehicle, VehicleStatus } from "@/lib/types";
import { daysInPatio, formatCurrency, formatDateTime } from "@/lib/utils";

const statusTabs: { key: VehicleStatus; label: string }[] = [
  { key: "NO_PATIO", label: "No Pátio" },
  { key: "LIBERACAO_SOLICITADA", label: "Liberação Solicitada" },
  { key: "LIBERACAO_CONFIRMADA", label: "Liberação Confirmada" },
  { key: "REMOCAO_CONFIRMADA", label: "Remoção Confirmada" },
  { key: "REMOVIDO", label: "Veículos Removidos" },
];

type VehicleFormState = {
  plate: string;
  brand: string;
  model: string;
  daily_rate: string;
  entry_at: string;
  partner_id: string;
  notes: string;
};

const emptyVehicleForm: VehicleFormState = {
  plate: "",
  brand: "",
  model: "",
  daily_rate: "",
  entry_at: "",
  partner_id: "",
  notes: "",
};

export default function GestaoPatioPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<VehicleStatus>("NO_PATIO");
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] =
    useState<VehicleFormState>(emptyVehicleForm);
  const [vehicleEditing, setVehicleEditing] = useState<Vehicle | null>(null);

  const [releaseRequestModal, setReleaseRequestModal] = useState<Vehicle | null>(
    null
  );
  const [releaseRequestedBy, setReleaseRequestedBy] = useState("");

  const [releaseConfirmModal, setReleaseConfirmModal] = useState<Vehicle | null>(
    null
  );
  const [payerName, setPayerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [releaseConfirmedBy, setReleaseConfirmedBy] = useState("");

  const [removalConfirmModal, setRemovalConfirmModal] = useState<Vehicle | null>(
    null
  );
  const [removalConfirmedBy, setRemovalConfirmedBy] = useState("");

  const [vehicleRemovedModal, setVehicleRemovedModal] = useState<Vehicle | null>(
    null
  );
  const [removedAt, setRemovedAt] = useState("");
  const [removedBy, setRemovedBy] = useState("");

  const [deleteModal, setDeleteModal] = useState<Vehicle | null>(null);
  const [historyModal, setHistoryModal] = useState<Vehicle | null>(null);

  const fetchData = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: vehicleData } = await supabase.from("vehicles").select("*");
    const { data: partnerData } = await supabase.from("partners").select("*");
    const { data: receivableData } = await supabase
      .from("accounts_receivable")
      .select("*");

    setVehicles((vehicleData ?? []) as Vehicle[]);
    setPartners((partnerData ?? []) as Partner[]);
    setReceivables((receivableData ?? []) as AccountReceivable[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as VehicleStatus | null;
    if (tabParam && statusTabs.some((item) => item.key === tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);

  const partnerMap = useMemo(() => {
    return partners.reduce<Record<string, Partner>>((acc, partner) => {
      acc[partner.id] = partner;
      return acc;
    }, {});
  }, [partners]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesStatus = vehicle.status === tab;
      const matchesSearch = vehicle.plate
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [vehicles, tab, search]);

  const handleOpenCreate = () => {
    setVehicleEditing(null);
    setVehicleForm({
      ...emptyVehicleForm,
      entry_at: new Date().toISOString().slice(0, 16),
    });
    setVehicleModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setVehicleEditing(vehicle);
    setVehicleForm({
      plate: vehicle.plate,
      brand: vehicle.brand ?? "",
      model: vehicle.model ?? "",
      daily_rate: String(vehicle.daily_rate ?? ""),
      entry_at: vehicle.entry_at.slice(0, 16),
      partner_id: vehicle.partner_id ?? "",
      notes: vehicle.notes ?? "",
    });
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async () => {
    const supabase = createSupabaseBrowserClient();
    const payload = {
      plate: vehicleForm.plate.toUpperCase(),
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      daily_rate: Number(vehicleForm.daily_rate),
      entry_at: new Date(vehicleForm.entry_at).toISOString(),
      partner_id: vehicleForm.partner_id || null,
      notes: vehicleForm.notes || null,
    };

    if (vehicleEditing) {
      await supabase
        .from("vehicles")
        .update(payload)
        .eq("id", vehicleEditing.id);
    } else {
      await supabase.from("vehicles").insert({
        ...payload,
        status: "NO_PATIO",
      });
    }

    setVehicleModalOpen(false);
    await fetchData();
  };

  const handleDeleteVehicle = async () => {
    if (!deleteModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("vehicles").delete().eq("id", deleteModal.id);
    setDeleteModal(null);
    await fetchData();
  };

  const handleReleaseRequested = async () => {
    if (!releaseRequestModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("vehicles")
      .update({
        status: "LIBERACAO_SOLICITADA",
        release_requested_by: releaseRequestedBy,
      })
      .eq("id", releaseRequestModal.id);
    setReleaseRequestModal(null);
    setReleaseRequestedBy("");
    await fetchData();
  };

  const handleReleaseConfirmed = async () => {
    if (!releaseConfirmModal) return;
    const supabase = createSupabaseBrowserClient();
    const amount =
      daysInPatio(releaseConfirmModal.entry_at) *
      Number(releaseConfirmModal.daily_rate);

    await supabase
      .from("vehicles")
      .update({
        status: "LIBERACAO_CONFIRMADA",
        payer_name: payerName,
        release_due_date: dueDate,
        release_confirmed_by: releaseConfirmedBy || null,
      })
      .eq("id", releaseConfirmModal.id);

    await supabase.from("accounts_receivable").insert({
      vehicle_id: releaseConfirmModal.id,
      payer_name: payerName,
      due_date: dueDate,
      amount,
      status: "ABERTO",
    });

    setReleaseConfirmModal(null);
    setPayerName("");
    setDueDate("");
    setReleaseConfirmedBy("");
    await fetchData();
  };

  const handleRemovalConfirmed = async () => {
    if (!removalConfirmModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("vehicles")
      .update({
        status: "REMOCAO_CONFIRMADA",
        removal_confirmed_by: removalConfirmedBy,
      })
      .eq("id", removalConfirmModal.id);
    setRemovalConfirmModal(null);
    setRemovalConfirmedBy("");
    await fetchData();
  };

  const handleVehicleRemoved = async () => {
    if (!vehicleRemovedModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("vehicles")
      .update({
        status: "REMOVIDO",
        removed_at: new Date(removedAt).toISOString(),
        removed_by: removedBy,
      })
      .eq("id", vehicleRemovedModal.id);
    setVehicleRemovedModal(null);
    setRemovedAt("");
    setRemovedBy("");
    await fetchData();
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">Carregando...</div>;
  }

  const canSaveVehicle =
    vehicleForm.plate.trim() !== "" && vehicleForm.daily_rate.trim() !== "";
  const canRequestRelease = releaseRequestedBy.trim() !== "";
  const canConfirmRelease = payerName.trim() !== "" && dueDate.trim() !== "";
  const canConfirmRemoval = removalConfirmedBy.trim() !== "";
  const canMarkRemoved = removedAt.trim() !== "" && removedBy.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gestão de Pátio</h2>
        <Button onClick={handleOpenCreate}>Registrar Veículo</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((item) => (
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

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por placa..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Localizador</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Valor gerado</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-medium">{vehicle.plate}</td>
                <td className="px-4 py-3">{vehicle.brand ?? "-"}</td>
                <td className="px-4 py-3">{vehicle.model ?? "-"}</td>
                <td className="px-4 py-3">
                  {vehicle.partner_id
                    ? partnerMap[vehicle.partner_id]?.name
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  {formatDateTime(vehicle.entry_at)}
                </td>
                <td className="px-4 py-3">
                  {formatCurrency(
                    daysInPatio(vehicle.entry_at) *
                      Number(vehicle.daily_rate)
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {vehicle.status === "NO_PATIO" ? (
                      <Button
                        variant="secondary"
                        onClick={() => setReleaseRequestModal(vehicle)}
                      >
                        Liberação solicitada
                      </Button>
                    ) : null}
                    {vehicle.status === "LIBERACAO_SOLICITADA" ? (
                      <Button
                        variant="secondary"
                        onClick={() => setReleaseConfirmModal(vehicle)}
                      >
                        Liberação confirmada
                      </Button>
                    ) : null}
                    {vehicle.status === "LIBERACAO_CONFIRMADA" ? (
                      <Button
                        variant="secondary"
                        onClick={() => setRemovalConfirmModal(vehicle)}
                      >
                        Remoção confirmada
                      </Button>
                    ) : null}
                    {vehicle.status === "REMOCAO_CONFIRMADA" ? (
                      <Button
                        variant="secondary"
                        onClick={() => setVehicleRemovedModal(vehicle)}
                      >
                        Veículo removido
                      </Button>
                    ) : null}
                    {vehicle.status === "REMOVIDO" ? (
                      <Button
                        variant="ghost"
                        onClick={() => setHistoryModal(vehicle)}
                      >
                        Imprimir histórico
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenEdit(vehicle)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteModal(vehicle)}
                    >
                      Apagar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Nenhum veículo encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        title={vehicleEditing ? "Editar veículo" : "Registrar veículo"}
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setVehicleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVehicle} disabled={!canSaveVehicle}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-zinc-600">Placa</label>
            <Input
              value={vehicleForm.plate}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, plate: event.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Marca</label>
            <Input
              value={vehicleForm.brand}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, brand: event.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Modelo</label>
            <Input
              value={vehicleForm.model}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, model: event.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Valor diária</label>
            <Input
              type="number"
              value={vehicleForm.daily_rate}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  daily_rate: event.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Entrada</label>
            <Input
              type="datetime-local"
              value={vehicleForm.entry_at}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  entry_at: event.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Localizador</label>
            <Select
              value={vehicleForm.partner_id}
              onChange={(event) =>
                setVehicleForm({
                  ...vehicleForm,
                  partner_id: event.target.value,
                })
              }
            >
              <option value="">Selecione</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-zinc-600">Observações</label>
            <Textarea
              value={vehicleForm.notes}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, notes: event.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Solicitar liberação"
        isOpen={!!releaseRequestModal}
        onClose={() => setReleaseRequestModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setReleaseRequestModal(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReleaseRequested}
              disabled={!canRequestRelease}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div>
          <label className="text-sm text-zinc-600">
            Quem solicitou a liberação
          </label>
          <Input
            value={releaseRequestedBy}
            onChange={(event) => setReleaseRequestedBy(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Confirmar liberação"
        isOpen={!!releaseConfirmModal}
        onClose={() => setReleaseConfirmModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setReleaseConfirmModal(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReleaseConfirmed}
              disabled={!canConfirmRelease}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <label className="text-sm text-zinc-600">
              Responsável financeiro (pagador)
            </label>
            <Input
              value={payerName}
              onChange={(event) => setPayerName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Previsão de pagamento</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Quem confirmou</label>
            <Input
              value={releaseConfirmedBy}
              onChange={(event) => setReleaseConfirmedBy(event.target.value)}
            />
          </div>
          {releaseConfirmModal ? (
            <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Snapshot da cobrança:{" "}
              <strong>
                {formatCurrency(
                  daysInPatio(releaseConfirmModal.entry_at) *
                    Number(releaseConfirmModal.daily_rate)
                )}
              </strong>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="Confirmar remoção"
        isOpen={!!removalConfirmModal}
        onClose={() => setRemovalConfirmModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemovalConfirmModal(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRemovalConfirmed}
              disabled={!canConfirmRemoval}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div>
          <label className="text-sm text-zinc-600">
            Responsável pela remoção
          </label>
          <Input
            value={removalConfirmedBy}
            onChange={(event) => setRemovalConfirmedBy(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Veículo removido"
        isOpen={!!vehicleRemovedModal}
        onClose={() => setVehicleRemovedModal(null)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setVehicleRemovedModal(null)}
            >
              Cancelar
            </Button>
            <Button onClick={handleVehicleRemoved} disabled={!canMarkRemoved}>
              Confirmar
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div>
            <label className="text-sm text-zinc-600">Data/hora remoção</label>
            <Input
              type="datetime-local"
              value={removedAt}
              onChange={(event) => setRemovedAt(event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Quem removeu</label>
            <Input
              value={removedBy}
              onChange={(event) => setRemovedBy(event.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Confirmar remoção do veículo"
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteVehicle}>
              Apagar
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Esta ação não pode ser desfeita. Deseja continuar?
        </p>
      </Modal>

      <Modal
        title="Histórico do veículo"
        isOpen={!!historyModal}
        onClose={() => setHistoryModal(null)}
        footer={<Button onClick={() => setHistoryModal(null)}>Fechar</Button>}
      >
        {historyModal ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{historyModal.status}</Badge>
              {historyModal.payer_name ? (
                <Badge tone="success">Pagador: {historyModal.payer_name}</Badge>
              ) : null}
            </div>
            <div>
              <strong>Placa:</strong> {historyModal.plate}
            </div>
            <div>
              <strong>Marca/Modelo:</strong>{" "}
              {historyModal.brand} {historyModal.model}
            </div>
            <div>
              <strong>Entrada:</strong> {formatDateTime(historyModal.entry_at)}
            </div>
            <div>
              <strong>Remoção:</strong> {formatDateTime(historyModal.removed_at)}
            </div>
            <div>
              <strong>Solicitou:</strong>{" "}
              {historyModal.release_requested_by ?? "-"}
            </div>
            <div>
              <strong>Confirmou:</strong>{" "}
              {historyModal.release_confirmed_by ?? "-"}
            </div>
            <div>
              <strong>Remoção confirmada:</strong>{" "}
              {historyModal.removal_confirmed_by ?? "-"}
            </div>
            <div>
              <strong>Quem removeu:</strong> {historyModal.removed_by ?? "-"}
            </div>
            <div>
              <strong>Cobrança:</strong>{" "}
              {receivables.find(
                (receivable) => receivable.vehicle_id === historyModal.id
              )
                ? formatCurrency(
                    Number(
                      receivables.find(
                        (receivable) =>
                          receivable.vehicle_id === historyModal.id
                      )?.amount ?? 0
                    )
                  )
                : "-"}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
