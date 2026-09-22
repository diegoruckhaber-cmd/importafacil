-- Apply only after the server-saving deployment is READY.
begin;
revoke insert, update on public.simulations from authenticated;
revoke insert (user_id,name,input,result) on public.simulations from authenticated;
revoke update (name,input,result) on public.simulations from authenticated;
drop policy if exists simulations_insert_own on public.simulations;
drop policy if exists simulations_update_own on public.simulations;
commit;
