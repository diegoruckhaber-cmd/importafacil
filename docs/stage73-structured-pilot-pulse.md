# Stage 73 — Structured pilot pulse

Stage 73 adds a short authenticated pulse survey for controlled-beta participants.

## What it measures

Each authenticated participant can maintain one current response containing:
- ease of completing the simulation, from 1 to 5;
- confidence in the result, from 1 to 5;
- perceived value for the import workflow, from 1 to 5;
- whether they would pay R$ 29,90/month for the current PRO offer;
- optional main blocker;
- optional pricing/value comment.

Free-form bug, calculation, UX and feature feedback remains in the existing beta feedback channel. The pilot pulse does not replace it.

## Privacy and access

Responses are stored in `public.pilot_responses`.
RLS is enabled and select/insert/update/delete are restricted to `auth.uid() = user_id`.
Anonymous table access is revoked.

The application does not publish an administrative participant list or expose another participant's response.

## Pilot metrics

The pilot should be evaluated with:
1. account creation to first server-verified V2 save as the activation-time proxy;
2. share of participants completing at least one server-verified V2 save;
3. average ease, confidence and perceived-value scores;
4. share answering yes to willingness to pay;
5. recurring blocker themes from the optional pulse text and structured beta feedback.

A saved simulation counts only when `result.contract = 'importafacil-simulation-v2'` and `server_execution` is present.

This stage instruments measurement. It does not claim that any external participant has completed the pilot yet.
