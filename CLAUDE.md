# Dashboard Agent

This repo supports multiple independent dashboards, each at `/d/<slug>`. The root `/` shows a picker listing all dashboards.

## Available Commands

- `/dashboard:new` — Start a session: define a datasource and build charts (creates dashboard dir if new)
- `/dashboard:edit` — Edit an existing chart or its adapter
- `/dashboard:promote` — Promote current `.session/` to the target dashboard
- `/dashboard:preview` — Open the session preview at `/d/<slug>/preview`
- `/dashboard:refresh` — Re-run all adapters across all dashboards

## Core Rules

1. **Never write to any `dashboard.json` directly.** Only `bin/promote` may modify it.
2. **Never promote without explicit user confirmation.** The final `AskUserQuestion` is required.
3. **Always read `.session/context.json`, `dashboards/`, and the target dashboard before asking any question.**
4. **Never ask a question Claude can answer through inspection or research.**
   - If the answer can be found by reading the data, running the adapter, or fetching documentation → do that first.
5. **Build first, curate second.** Never ask "what chart type do you want?" before building.
   - Build 2–4 chart variants, show them in `/preview`, let the user choose.
6. **Use WebSearch and WebFetch for any named external API** before writing adapter code.
7. **`bin/` scripts handle side effects. Skills handle UX.**
   - Do not put AskUserQuestion logic in bin/ scripts.
8. **Self-correct adapter failures once** before surfacing errors to the user.
9. **When creating a new session, write `.session/context.json` first** with the target dashboard slug.

## Session Model

Work lives in `.session/` until promotion:
```
.session/
  context.json    ← FIRST artifact: { "dashboard": "<slug>" }
  datasource.json ← Phase artifact: source config + slug + source attribution
  adapter.py      ← Phase artifact: generated Python adapter
  charts.json     ← Phase artifact: ECharts configs (full option objects)
  placement.json  ← Phase artifact: dashboard layout placement
```

Presence of a file = that phase is complete. Missing files = session can be resumed.

## Repository Layout

```
dashboards/
  metals/
    dashboard.json      ← source of truth for this dashboard
    adapters/           ← Python adapters for this dashboard
      silver-price.py
      gold-price.py
    data/               ← JSON data files served at /d/metals/data/*
      silver-price-line.json
      gold-price-line.json
src/           Vite + React + TypeScript + Tailwind app
bin/           CLI scripts (start, promote, refresh-data, session-status)
.session/      Ephemeral staging (gitignored)
```

## Dashboard.json Schema (abbreviated)

```json
{
  "title": "...",
  "description": "",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  "theme": { "mode": "dark", "accent": "#00d4ff", "font": "JetBrains Mono" },
  "chart_height": 400,
  "sections": [
    {
      "id": "section-slug",
      "title": "Section Name",
      "rows": [
        { "text_block": { "type": "paragraph", "content": "..." } },
        { "slots": [{ "type": "chart", "chartId": "my-chart", "width": "full" }] }
      ]
    }
  ],
  "charts": {
    "my-chart": {
      "id": "my-chart",
      "title": "My Chart",
      "source": "GitHub REST API",
      "dataSource": ["data/my-data.json"],
      "echartsOption": { ...full ECharts option... }
    }
  }
}
```

Valid slot widths per row (must sum to full): `full`, `1/2+1/2`, `1/3+1/3+1/3`, `2/3+1/3`, `1/3+2/3`

## Adapter Contract

Each `dashboards/<slug>/adapters/<name>.py` must:
- Load `.env` via `python-dotenv`
- Read `DASHBOARD_DIR` env var to resolve output paths:
  ```python
  import os
  DASHBOARD_DIR = os.environ.get("DASHBOARD_DIR", "dashboards/metals")
  os.makedirs(f"{DASHBOARD_DIR}/data", exist_ok=True)
  with open(f"{DASHBOARD_DIR}/data/silver-price-line.json", "w") as f: ...
  ```
- Fetch data from the source
- Apply any transformations
- Write one **partial ECharts option** per chart to `{DASHBOARD_DIR}/data/`, as a JSON file that gets merged into the stored `echartsOption` at render time

**Multi-chart adapters are the normal case.** When a session has multiple charts, write one data file per chart (e.g. `data/<slug>-monthly.json`, `data/<slug>-genre.json`). Each chart's `dataSource` points to its own file. Do not combine all chart data into a single file.

Example output format:
```json
{
  "xAxis": { "data": ["EC2", "S3", "RDS"] },
  "series": [{ "data": [124.5, 45.2, 67.8] }]
}
```

**ECharts `formatter` must be a string template, not a function.** JSON cannot serialize JS functions. Use ECharts template syntax (e.g. `"{b}: ${c}"`) for all `formatter` fields stored in `charts.json` or `dashboard.json`. Function formatters silently break at render time.

**On "Exit without promoting", delete data files written by the adapter** in addition to clearing `.session/`. Orphaned files in `dashboards/<slug>/data/` persist across sessions and pollute the directory.
