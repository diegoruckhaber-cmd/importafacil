-- Stage 47 — production/commercial hardening
-- Mirrors the migration applied to production on 2026-09-17.
-- Goal: prevent client-side plan escalation, minimize table grants, and optimize RLS auth lookups.

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Profiles are server-managed for billing/entitlement fields.
revoke all privileges on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Simulations remain user-owned; anonymous and DDL-style privileges are removed.
revoke all privileges on table public.simulations from anon;
revoke truncate, references, trigger on table public.simulations from authenticated;
grant select, insert, update, delete on table public.simulations to authenticated;

drop policy if exists simulations_select_own on public.simulations;
drop policy if exists simulations_insert_own on public.simulations;
drop policy if exists simulations_update_own on public.simulations;
drop policy if exists simulations_delete_own on public.simulations;

create policy simulations_select_own
on public.simulations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy simulations_insert_own
on public.simulations
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.plan = any (array['PRO'::text, 'BUSINESS'::text])
    )
    or (
      exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.plan = 'FREE'::text
      )
      and (
        select count(*) from public.simulations s
        where s.user_id = (select auth.uid())
      ) < 3
    )
  )
);

create policy simulations_update_own
on public.simulations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy simulations_delete_own
on public.simulations
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Subscription rows are written only by trusted backend code and read only by their owner.
revoke all privileges on table public.subscriptions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.subscriptions from authenticated;
grant select on table public.subscriptions to authenticated;

drop policy if exists subscriptions_select_own on public.subscriptions;

create policy subscriptions_select_own
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);
