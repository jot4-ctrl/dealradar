create extension if not exists pgcrypto;

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('paypal', 'mercadopago')),
  provider_subscription_id text not null,
  plan_id text,
  status text not null default 'pending',
  payer_email text,
  current_period_end timestamptz,
  last_event_at timestamptz,
  provider_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create index if not exists billing_subscriptions_user_idx
  on public.billing_subscriptions (user_id, status, current_period_end desc);

alter table public.billing_subscriptions enable row level security;

drop policy if exists "Users can read their billing subscriptions" on public.billing_subscriptions;
create policy "Users can read their billing subscriptions"
  on public.billing_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_billing_subscription_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute function public.set_billing_subscription_updated_at();
