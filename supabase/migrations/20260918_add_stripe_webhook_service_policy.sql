create policy stripe_webhook_events_service_role_all
on public.stripe_webhook_events
for all
to service_role
using (true)
with check (true);
