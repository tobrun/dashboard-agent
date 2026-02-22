---
name: dashboard-edit
description: Edit an existing chart or its adapter. Opens a session targeting the chart, makes changes, and promotes back to the dashboard.
---

Edit an existing chart or its adapter.

## Before asking anything

Run `bin/session-status`. If an incomplete session exists, ask to resume or discard (same as `dashboard:new` Step 1).

Read `.session/context.json` if present — this gives the active `dashboard` slug.

If no context.json, determine the target dashboard from:
- The chart-id or slug provided as an argument
- If ambiguous, list dashboards and ask

## Step 0 — Determine target dashboard

If the target dashboard slug is not already known, list existing `dashboards/*/dashboard.json` files, then:
- If the argument identifies a chart-id unambiguously (it exists in exactly one dashboard), use that dashboard.
- Otherwise, ask via **AskUserQuestion**: "Which dashboard contains the chart you want to edit?"

Write `.session/context.json`:
```json
{ "dashboard": "<slug>" }
```

## Step 1 — Select chart

If no chart-id was provided as an argument, list all charts from `dashboards/<slug>/dashboard.json`:
```
Charts in <slug>:
  1. <title> (id: <id>)
  2. <title> (id: <id>)
  ...
```

**AskUserQuestion**: "Which chart do you want to edit?"

## Step 2 — Load artifacts into `.session/`

Silently populate `.session/` from the existing chart:

1. Copy `dashboards/<slug>/adapters/<adapter-slug>.py` → `.session/adapter.py`
2. Extract the chart config from `dashboards/<slug>/dashboard.json["charts"][chartId]` → write `.session/charts.json` (as a single-item array)
3. Find the chart's current placement in `dashboards/<slug>/dashboard.json["sections"]` → write `.session/placement.json`
4. Write `.session/datasource.json` with `"is_edit": true` and `"replaces_chart_id": "<chartId>"`

Run the current adapter with the correct env var to get fresh data for context:
```
DASHBOARD_DIR=dashboards/<slug> python .session/adapter.py
```

## Step 3 — Diagnose and propose

Ask a single open question:
> "What would you like to change about **<chart title>**?"

From the answer, **immediately determine the scope** and do the work silently:

- **Data/query change** → modify `.session/adapter.py`, re-run it with `DASHBOARD_DIR=dashboards/<slug>`, inspect output, regenerate ECharts option if data shape changed
- **Visual/chart type change** → update the ECharts option in `.session/charts.json`
- **Placement change** → update `.session/placement.json`
- **Multiple changes** → do all of them

Then open preview (`bin/start --preview`) which opens `/d/<slug>/preview` and propose what changed:

```
Here's what I changed:

  Adapter:  <describe change, or "unchanged">
  Chart:    <describe change, or "unchanged">
  Placement: <describe change, or "unchanged">

Open preview: http://localhost:5173/d/<slug>/preview
Does this look right?
```

Iterate until confirmed.

## Step 4 — Confirm and promote

Show a summary noting this is an update:

```
Ready to update dashboard:

  Dashboard: <slug>
  Chart:    <title> (replacing existing id: <id>)
  Adapter:  dashboards/<slug>/adapters/<slug>.py (overwritten)
  Section:  <name> (layout unchanged)

Promote?
```

**AskUserQuestion**: **Yes, promote** | **Go back and adjust**

On approval: run `bin/promote`. The existing chart entry is replaced.

## Guardrails

- Never write to `dashboard.json` directly.
- Never run `bin/promote` without confirmation.
- `is_edit: true` in `datasource.json` tells `bin/promote` to replace rather than append.
- Adapters MUST use `DASHBOARD_DIR` env var for output paths.
- Always write `.session/context.json` before other artifacts.
