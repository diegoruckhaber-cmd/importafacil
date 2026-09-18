create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category in ('bug', 'calculation_question', 'ux', 'feature_request', 'other')),
  message text not null
    check (char_length(message) between 10 and 2000),
  page_path text
    check (page_path is null or (char_length(page_path) between 1 and 200 and page_path like '/%')),
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

revoke all on table public.beta_feedback from public, anon;
grant select, insert on table public.beta_feedback to authenticated;
grant select, insert, update, delete on table public.beta_feedback to service_role;

create policy beta_feedback_select_own
on public.beta_feedback
for select
to authenticated
using (auth.uid() = user_id);

create policy beta_feedback_insert_own
on public.beta_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists beta_feedback_user_created_idx
  on public.beta_feedback (user_id, created_at desc);
