-- Additive rollout: old unverified saves work until the final write cutover.
begin;
alter table public.simulations add column if not exists server_execution jsonb;
-- Clients cannot assert provenance. They can only write legacy columns for now.
revoke insert, update on public.simulations from authenticated;
grant insert (user_id,name,input,result) on public.simulations to authenticated;
grant update (name,input,result) on public.simulations to authenticated;
drop policy if exists simulations_update_own on public.simulations;
create policy simulations_update_own on public.simulations for update to authenticated
  using ((select auth.uid()) = user_id and server_execution is null)
  with check ((select auth.uid()) = user_id and server_execution is null);

create or replace function public.save_official_simulation(
  p_user_id uuid, p_name text, p_input jsonb, p_result jsonb, p_execution jsonb
) returns table(id uuid, created_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare account_plan text;
begin
  -- Only service_role can execute; the API obtains this ID via auth.getUser.
  select p.plan into account_plan from public.profiles p where p.id=p_user_id for update;
  if not found then raise exception 'profile_missing'; end if;
  if account_plan not in ('PRO','BUSINESS') and
    (select count(*) from public.simulations s where s.user_id=p_user_id) >= 3 then
    raise exception 'simulation_limit_reached';
  end if;
  if p_execution->>'source' is distinct from 'official_server' or
     p_execution->>'id' is null or jsonb_typeof(p_input) <> 'object' or
     jsonb_typeof(p_result) <> 'object' then raise exception 'invalid_execution'; end if;
  return query insert into public.simulations(user_id,name,input,result,server_execution)
    values(p_user_id,left(p_name,200),p_input,p_result,p_execution)
    returning simulations.id,simulations.created_at;
end;
$$;
revoke all on function public.save_official_simulation(uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_official_simulation(uuid,text,jsonb,jsonb,jsonb) to service_role;
commit;
