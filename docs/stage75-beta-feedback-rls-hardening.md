# Stage 75 — Beta feedback RLS hardening

Stage 75 aligns the original beta feedback table with the stricter access model introduced for pilot responses.

## Database hardening

Authenticated users keep only the table privileges used by the product:
- SELECT;
- INSERT;
- DELETE.

Unused UPDATE, TRUNCATE, REFERENCES and TRIGGER privileges are removed.

The three user-scoped RLS policies continue to enforce ownership, now using `(select auth.uid())` so PostgreSQL can evaluate the authenticated user once per statement instead of once per candidate row.

## Production verification

Production was checked after the SQL change:
- authenticated grants are exactly SELECT, INSERT and DELETE;
- SELECT, INSERT and DELETE policies remain scoped to the caller's `user_id`;
- the existing `beta_feedback_user_created_idx` remains present;
- Supabase performance advisors no longer report `auth_rls_initplan` warnings for `public.beta_feedback`;
- the only security advisor warning remains the pre-existing leaked-password-protection setting.

This stage changes no feedback content, simulation logic, billing logic or product entitlement.
