export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("pt-BR");
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("pt-BR");
};

export const daysInPatio = (entryAt: string, now = new Date()) => {
  const entry = new Date(entryAt);
  const diffMs = now.getTime() - entry.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

export const sum = (values: number[]) =>
  values.reduce((acc, value) => acc + value, 0);
