begin;

create or replace function public.save_official_simulation(
  p_user_id uuid, p_name text, p_input jsonb, p_result jsonb, p_execution jsonb
) returns table(id uuid, created_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare account_plan text;
begin
  select p.plan into account_plan from public.profiles p where p.id=p_user_id for update;
  if not found then raise exception 'profile_missing'; end if;

  -- Legacy pre-cutover rows have no server provenance and must not consume
  -- the FREE quota for the official post-cutover save flow.
  if account_plan not in ('PRO','BUSINESS') and
    (select count(*) from public.simulations s
      where s.user_id=p_user_id and s.server_execution is not null) >= 3 then
    raise exception 'simulation_limit_reached';
  end if;

  if p_execution->>'source' is distinct from 'official_server' or
     p_execution->>'id' is null or jsonb_typeof(p_input) <> 'object' or
     jsonb_typeof(p_result) <> 'object' then
    raise exception 'invalid_execution';
  end if;

  return query
    insert into public.simulations(user_id,name,input,result,server_execution)
    values(p_user_id,left(p_name,200),p_input,p_result,p_execution)
    returning simulations.id,simulations.created_at;
end;
$$;

revoke all on function public.save_official_simulation(uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_official_simulation(uuid,text,jsonb,jsonb,jsonb) to service_role;

commit;
