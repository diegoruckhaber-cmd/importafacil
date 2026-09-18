# Stage 58 — Security and privacy hardening

This stage tightens application boundaries without changing fiscal logic.

Controls:
- authenticated simulation persistence reads Supabase URL/key from environment variables instead of repository constants and fails closed when missing;
- baseline browser headers disable MIME sniffing, framing, camera, microphone and geolocation access, reduce referrer leakage and remove the framework identification header;
- billing webhook audit failures no longer emit raw exception messages;
- public privacy and controlled-beta terms pages describe account/simulation storage, Stripe billing, infrastructure providers, privacy-safe telemetry, fiscal scope and fail-closed behavior;
- privacy/terms are linked from the public home and included in the canonical sitemap.

Residual platform item:
- Supabase Leaked Password Protection remains a provider-level recommendation. It is not emulated with a parallel password service because Supabase Auth remains the credential authority.

No Content-Security-Policy is asserted in this stage because a strict CSP for the current Next.js runtime requires nonce/hash deployment work; deploying an unverified CSP would risk breaking authentication or hydration.
