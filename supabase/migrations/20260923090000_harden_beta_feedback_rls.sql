revoke all on table public.beta_feedback from public, anon, authenticated;
grant select, insert, delete on table public.beta_feedback to authenticated;
grant select, insert, update, delete on table public.beta_feedback to service_role;

drop policy if exists beta_feedback_select_own on public.beta_feedback;
create policy beta_feedback_select_own
on public.beta_feedback
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists beta_feedback_insert_own on public.beta_feedback;
create policy beta_feedback_insert_own
on public.beta_feedback
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists beta_feedback_delete_own on public.beta_feedback;
create policy beta_feedback_delete_own
on public.beta_feedback
for delete
to authenticated
using ((select auth.uid()) = user_id);
