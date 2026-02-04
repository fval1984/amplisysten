export type Partner = {
  id: string;
  user_id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  contact: string | null;
  created_at: string;
};

export type VehicleStatus =
  | "NO_PATIO"
  | "LIBERACAO_SOLICITADA"
  | "LIBERACAO_CONFIRMADA"
  | "REMOCAO_CONFIRMADA"
  | "REMOVIDO";

export type Vehicle = {
  id: string;
  user_id: string;
  partner_id: string | null;
  plate: string;
  brand: string | null;
  model: string | null;
  daily_rate: number;
  entry_at: string;
  status: VehicleStatus;
  notes: string | null;
  release_requested_by: string | null;
  release_confirmed_by: string | null;
  payer_name: string | null;
  release_due_date: string | null;
  removal_confirmed_by: string | null;
  removed_at: string | null;
  removed_by: string | null;
  created_at: string;
};

export type ReceivableStatus = "ABERTO" | "PAGO";

export type AccountReceivable = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  payer_name: string;
  due_date: string;
  amount: number;
  status: ReceivableStatus;
  paid_at: string | null;
  created_at: string;
};

export type PayableStatus = "ABERTO" | "PAGO";

export type AccountPayable = {
  id: string;
  user_id: string;
  type: string | null;
  description: string;
  amount: number;
  due_date: string;
  status: PayableStatus;
  paid_at: string | null;
  created_at: string;
};

export type LedgerType = "ENTRADA" | "SAIDA";

export type CashLedger = {
  id: string;
  user_id: string;
  type: LedgerType;
  amount: number;
  description: string | null;
  source: string | null;
  occurred_at: string;
  created_at: string;
};

export type Settings = {
  id: string;
  user_id: string;
  company_name: string | null;
  cnpj: string | null;
  bank_details: string | null;
  template_billing: string | null;
  template_invoice: string | null;
  created_at: string;
};
