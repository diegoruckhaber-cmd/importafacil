create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'ignored')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  last_error text
);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;

create index if not exists stripe_webhook_events_status_received_idx
  on public.stripe_webhook_events (status, received_at desc);
