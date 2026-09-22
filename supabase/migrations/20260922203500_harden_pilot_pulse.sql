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
