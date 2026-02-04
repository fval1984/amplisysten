export const ADMIN_EMAIL = "fernandolima@ampliauto.com.br";

export const VEHICLE_STATUSES = [
  "NO_PATIO",
  "LIBERACAO_SOLICITADA",
  "LIBERACAO_CONFIRMADA",
  "REMOCAO_CONFIRMADA",
  "REMOVIDO",
] as const;

export const RECEIVABLE_STATUSES = ["ABERTO", "PAGO"] as const;
export const PAYABLE_STATUSES = ["ABERTO", "PAGO"] as const;
export const LEDGER_TYPES = ["ENTRADA", "SAIDA"] as const;
