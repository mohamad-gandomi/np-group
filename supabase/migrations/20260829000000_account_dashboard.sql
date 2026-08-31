create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending_review', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'خانه',
  recipient text not null,
  phone text not null,
  province text not null,
  city text not null,
  address_line text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('NP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending_review',
  subtotal bigint not null check (subtotal >= 0),
  shipping bigint not null default 0 check (shipping >= 0),
  total bigint not null check (total >= 0),
  contact_name text not null,
  contact_phone text not null,
  address_snapshot jsonb not null,
  delivery_method text not null,
  payment_method text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  image text not null,
  color text not null,
  quantity integer not null check (quantity > 0 and quantity <= 20),
  unit_price bigint not null check (unit_price >= 0)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users read own order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Users read own order history" on public.order_status_history for select using (exists (select 1 from public.orders where orders.id = order_status_history.order_id and orders.user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, coalesce(new.phone, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.record_initial_order_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.order_status_history (order_id, status) values (new.id, new.status);
  return new;
end;
$$;

create trigger on_order_created
  after insert on public.orders
  for each row execute procedure public.record_initial_order_status();
