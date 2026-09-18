# Stage 55 — Simulator UX and jurisdiction clarity

Simulation V2 is now explicitly jurisdiction-aware at the product surface.

## Product behavior
- the operation requires a destination UF selected from the 27 homologated UFs;
- `destinationUf` is sent to the canonical `/api/simulation-v2` contract;
- Santa Catarina keeps its full state engine and exposes SC-specific TTD inputs;
- every non-SC UF is presented as `general_rate_only`: the homologated general ICMS rate is authoritative and manual ICMS editing is hidden;
- special benefits, reductions, exemptions, ST, deferments, anticipations and special regimes remain outside automatic scope for `general_rate_only` states;
- client validation catches incomplete NCM, origin, quantity, margins, invalid monetary assumptions and missing weight for freight allocation before calling the API;
- response states are explained distinctly: calculated, alert, requires_input, blocked and unsupported;
- the result view displays destination, state scope and the ICMS rate actually returned by the engine;
- non-final states can still be saved as pre-studies, preserving snapshot/history behavior.

No tax formula, federal resolver, defense-commercial rule, state rate catalog or release-scope decision is modified by this stage.
