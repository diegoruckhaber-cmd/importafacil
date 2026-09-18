# Stage 52 — Authentication security

Application-side controls:
- signup requires a 10+ character password with uppercase, lowercase, number and symbol;
- login keeps compatibility with existing accounts while Supabase remains the credential authority;
- password recovery uses Supabase `resetPasswordForEmail` and the `PASSWORD_RECOVERY` event;
- recovery responses are intentionally non-enumerating;
- password changes end the recovery session and require a fresh login;
- auth rate-limit and weak-password errors are translated without exposing account existence.

Platform residual:
- Supabase Leaked Password Protection remains a platform-level advisor warning.
- Supabase documents this feature as available on Pro plans and above. The current project is not changed to a paid plan by this stage.
- The application does not implement a parallel password-breach service because Supabase Auth remains the credential authority.
