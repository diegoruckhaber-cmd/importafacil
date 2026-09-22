create table if not exists public.pilot_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ease_score smallint not null check (ease_score between 1 and 5),
  confidence_score smallint not null check (confidence_score between 1 and 5),
  value_score smallint not null check (value_score between 1 and 5),
  would_pay boolean not null,
  blocker text check (blocker is null or char_length(blocker) <= 1000),
  pricing_comment text check (pricing_comment is null or char_length(pricing_comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.pilot_responses enable row level security;

revoke all on table public.pilot_responses from anon, authenticated;
grant select, insert, update, delete on table public.pilot_responses to authenticated;

drop policy if exists pilot_responses_select_own on public.pilot_responses;
create policy pilot_responses_select_own
on public.pilot_responses for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists pilot_responses_insert_own on public.pilot_responses;
create policy pilot_responses_insert_own
on public.pilot_responses for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists pilot_responses_update_own on public.pilot_responses;
create policy pilot_responses_update_own
on public.pilot_responses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists pilot_responses_delete_own on public.pilot_responses;
create policy pilot_responses_delete_own
on public.pilot_responses for delete
to authenticated
using ((select auth.uid()) = user_id);
