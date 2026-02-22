---
name: dashboard-promote
description: Promote the current .session/ to the dashboard. Shows a summary and asks for confirmation before running bin/promote.
---

Promote the current session to the dashboard.

## Steps

1. Run `bin/session-status` and read the output.

2. If `has_session: false` or `complete: false`, report what's missing:
   ```
   Cannot promote — session is incomplete.
   Missing: <list missing artifacts>
   Run /dashboard:new to complete the session first.
   ```
   Stop.

3. Read `.session/context.json` to get the target `dashboard` slug.
   Read `.session/datasource.json`, `.session/charts.json`, `.session/placement.json`.

4. Display a summary:
   ```
   Ready to promote to dashboard:

     Dashboard:   <dashboard slug>
     Adapter:     dashboards/<dashboard>/adapters/<slug>.py
     Charts:      <chart titles with types>
     Section:     <section name> (new/existing)
     Text block:  "<intro text>" (if present)
   ```

5. **AskUserQuestion**: "Promote to dashboard?"
   Options: **Yes, promote** | **Cancel**

6. On approval: run `bin/promote`. Report the commit hash and rollback command.

## Guardrails

- Never run `bin/promote` without confirmation.
- If `bin/promote` exits non-zero, report the error and do not clear `.session/`.
