-- OMG Hub — Supabase setup
-- Paste this entire file into Supabase SQL Editor and click Run

create table if not exists omg_business (
  user_id uuid primary key references auth.users on delete cascade,
  data    jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists omg_clients (
  id         text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null default '',
  company    text default '',
  email      text default '',
  phone      text default '',
  address    text default '',
  city       text default '',
  country    text default '',
  notes      text default '',
  created_at timestamptz default now()
);

create table if not exists omg_documents (
  id                  text primary key,
  user_id             uuid not null references auth.users on delete cascade,
  type                text not null,
  status              text not null default 'draft',
  number              text not null,
  client_id           text default '',
  issue_date          text default '',
  due_date            text default '',
  valid_until         text default '',
  line_items          jsonb default '[]',
  subtotal            numeric default 0,
  discount_percent    numeric default 0,
  discount_amount     numeric default 0,
  vat_rate            numeric default 0,
  vat_amount          numeric default 0,
  total               numeric default 0,
  notes               text default '',
  terms_and_conditions text default '',
  payment_method      text default '',
  payment_date        text default '',
  payment_reference   text default '',
  related_document_id text default '',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists omg_bookings (
  id         text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  client_id  text default '',
  service    text default '',
  date       text not null,
  start_time text default '',
  end_time   text default '',
  location   text default '',
  status     text default 'pending',
  notes      text default '',
  document_id text default '',
  fee        numeric default 0,
  created_at timestamptz default now()
);

create table if not exists omg_counters (
  user_id   uuid primary key references auth.users on delete cascade,
  quotation integer default 0,
  invoice   integer default 0,
  receipt   integer default 0
);

-- Row Level Security — each user sees only their own data
alter table omg_business  enable row level security;
alter table omg_clients   enable row level security;
alter table omg_documents enable row level security;
alter table omg_bookings  enable row level security;
alter table omg_counters  enable row level security;

create policy "own" on omg_business  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on omg_clients   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on omg_documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on omg_bookings  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on omg_counters  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
