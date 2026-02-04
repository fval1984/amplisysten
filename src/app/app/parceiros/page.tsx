"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Partner, Vehicle } from "@/lib/types";
import { daysInPatio, formatCurrency, formatDateTime } from "@/lib/utils";

type PartnerForm = {
  name: string;
  cpf: string;
  email: string;
  contact: string;
};

const emptyPartnerForm: PartnerForm = {
  name: "",
  cpf: "",
  email: "",
  contact: "",
};

export default function ParceirosPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PartnerForm>(emptyPartnerForm);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Partner | null>(null);
  const [historyModal, setHistoryModal] = useState<Partner | null>(null);

  const fetchData = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: partnerData } = await supabase.from("partners").select("*");
    const { data: vehicleData } = await supabase.from("vehicles").select("*");
    setPartners((partnerData ?? []) as Partner[]);
    setVehicles((vehicleData ?? []) as Vehicle[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const partnerVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.partner_id === historyModal?.id);
  }, [vehicles, historyModal]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyPartnerForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (partner: Partner) => {
    setEditing(partner);
    setForm({
      name: partner.name,
      cpf: partner.cpf ?? "",
      email: partner.email ?? "",
      contact: partner.contact ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    const payload = {
      name: form.name,
      cpf: form.cpf || null,
      email: form.email || null,
      contact: form.contact || null,
    };

    if (editing) {
      await supabase.from("partners").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("partners").insert(payload);
    }
    setModalOpen(false);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("partners").delete().eq("id", deleteModal.id);
    setDeleteModal(null);
    await fetchData();
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Parceiros</h2>
        <Button onClick={handleOpenCreate}>Novo parceiro</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-medium">{partner.name}</td>
                <td className="px-4 py-3">{partner.cpf ?? "-"}</td>
                <td className="px-4 py-3">{partner.email ?? "-"}</td>
                <td className="px-4 py-3">{partner.contact ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setHistoryModal(partner)}
                    >
                      Histórico
                    </Button>
                    <Button variant="ghost" onClick={() => handleOpenEdit(partner)}>
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteModal(partner)}
                    >
                      Apagar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Nenhum parceiro cadastrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? "Editar parceiro" : "Novo parceiro"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-zinc-600">Nome</label>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">CPF</label>
            <Input
              value={form.cpf}
              onChange={(event) => setForm({ ...form, cpf: event.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Contato</label>
            <Input
              value={form.contact}
              onChange={(event) =>
                setForm({ ...form, contact: event.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Confirmar exclusão"
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Apagar
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Deseja realmente excluir este parceiro?
        </p>
      </Modal>

      <Modal
        title="Histórico do parceiro"
        isOpen={!!historyModal}
        onClose={() => setHistoryModal(null)}
        footer={<Button onClick={() => setHistoryModal(null)}>Fechar</Button>}
      >
        <div className="flex flex-col gap-3 text-sm text-zinc-600">
          {partnerVehicles.length === 0 ? (
            <span>Nenhum veículo associado.</span>
          ) : (
            partnerVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-md border border-zinc-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <strong>{vehicle.plate}</strong>
                  <span>{vehicle.status}</span>
                </div>
                <div>Entrada: {formatDateTime(vehicle.entry_at)}</div>
                <div>
                  Valor gerado:{" "}
                  {formatCurrency(
                    daysInPatio(vehicle.entry_at) * Number(vehicle.daily_rate)
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
