grant delete on table public.beta_feedback to authenticated;

create policy beta_feedback_delete_own
on public.beta_feedback
for delete
to authenticated
using (auth.uid() = user_id);
