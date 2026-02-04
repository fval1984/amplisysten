-- Amplipatio schema + RLS
create extension if not exists "pgcrypto";

create type vehicle_status as enum (
  'NO_PATIO',
  'LIBERACAO_SOLICITADA',
  'LIBERACAO_CONFIRMADA',
  'REMOCAO_CONFIRMADA',
  'REMOVIDO'
);

create type receivable_status as enum ('ABERTO', 'PAGO');
create type payable_status as enum ('ABERTO', 'PAGO');
create type ledger_type as enum ('ENTRADA', 'SAIDA');

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  cpf text,
  email text,
  contact text,
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  partner_id uuid references partners(id) on delete set null,
  plate text not null,
  brand text,
  model text,
  daily_rate numeric(12,2) not null,
  entry_at timestamptz not null default now(),
  status vehicle_status not null default 'NO_PATIO',
  notes text,
  release_requested_by text,
  release_confirmed_by text,
  payer_name text,
  release_due_date date,
  removal_confirmed_by text,
  removed_at timestamptz,
  removed_by text,
  created_at timestamptz not null default now()
);

create table if not exists accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  payer_name text not null,
  due_date date not null,
  amount numeric(12,2) not null,
  status receivable_status not null default 'ABERTO',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists accounts_payable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text,
  description text not null,
  amount numeric(12,2) not null,
  due_date date not null,
  status payable_status not null default 'ABERTO',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists cash_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type ledger_type not null,
  amount numeric(12,2) not null,
  description text,
  source text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique,
  company_name text,
  cnpj text,
  bank_details text,
  template_billing text,
  template_invoice text,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_user_status_idx
  on vehicles(user_id, status);
create index if not exists vehicles_plate_idx
  on vehicles(plate);
create index if not exists accounts_receivable_user_status_due_idx
  on accounts_receivable(user_id, status, due_date);
create index if not exists accounts_payable_user_status_due_idx
  on accounts_payable(user_id, status, due_date);

alter table partners enable row level security;
alter table vehicles enable row level security;
alter table accounts_receivable enable row level security;
alter table accounts_payable enable row level security;
alter table cash_ledger enable row level security;
alter table settings enable row level security;

create policy "partners_crud_own"
  on partners for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "vehicles_crud_own"
  on vehicles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "accounts_receivable_crud_own"
  on accounts_receivable for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "accounts_payable_crud_own"
  on accounts_payable for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cash_ledger_crud_own"
  on cash_ledger for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "settings_crud_own"
  on settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.days_in_patio(entry_at timestamptz, now_at timestamptz default now())
returns integer
language sql
stable
as $$
  select greatest(1, ceil(extract(epoch from (now_at - entry_at)) / 86400.0))::int;
$$;
