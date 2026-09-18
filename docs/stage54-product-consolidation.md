# Stage 54 — Canonical product surface

The public product now has one simulation entry point: `/simulacao-v2`.

Consolidation decisions:
- the home page is a lightweight product landing page instead of a second embedded calculator;
- Simulation V2 is the only public calculation CTA;
- legacy SC/test pages are preserved as URLs for compatibility but redirect to the canonical V2 flow;
- the former audit UI redirects to the read-only rules/history surface;
- underlying APIs and calculation engines are not removed, so regression coverage and backward compatibility are preserved;
- commercial release semantics remain controlled beta.

This stage changes navigation and presentation only. It does not change fiscal formulas, state activation, federal resolution, defense-commercial logic, or saved snapshot contracts.
