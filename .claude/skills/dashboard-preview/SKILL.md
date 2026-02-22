---
name: dashboard-preview
description: Open the session preview in the browser. Shows all charts currently in .session/charts.json at http://localhost:5173/d/<slug>/preview.
---

Open the session preview in the browser.

## Steps

1. Read `.session/context.json` if it exists to get the active `dashboard` slug.

2. Run `bin/start --preview`.
   - If context.json exists, `bin/start` auto-reads it and opens `/d/<slug>/preview`.
   - If no context.json, it opens `/preview` (fallback).

3. Read `.session/charts.json` if it exists.

4. Report to the user:
   - If charts exist: "Preview open at http://localhost:5173/d/<slug>/preview — showing <N> chart(s): <titles>"
   - If no charts yet: "Preview open at http://localhost:5173/d/<slug>/preview — no charts in the current session yet. Run /dashboard:new to start building."

## Notes

The preview polls `.session/charts.json` every 2 seconds. As you update charts during a session, the browser refreshes automatically without needing to rerun this skill.
