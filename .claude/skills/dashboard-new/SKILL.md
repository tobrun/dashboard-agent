---
name: dashboard-new
description: Start a new dashboard session. Define a datasource, generate an adapter, build charts, and promote to the dashboard. Claude does the reasoning; the human approves proposals.
---

Start a new session: define a datasource, build charts, promote to dashboard.

## Before asking anything

Read these files silently to build context:
1. `dashboards/` directory — list existing dashboard slugs and their titles
2. `.session/context.json` — active dashboard if session exists
3. Run `bin/session-status` — check if an incomplete session exists

Use this context in all proposals. Do NOT ask the user to describe what already exists.

## Step 0 — Determine target dashboard

Infer the target dashboard from:
1. Any slug or name mentioned in the user's request (e.g. "/dashboard:new portfolio" → `portfolio`) — skip straight to Step 1
2. `.session/context.json` if a session is already in progress — skip straight to Step 1

Otherwise, **always** show a dashboard selector via **AskUserQuestion**, even if only one dashboard exists (the user may want to create a new one):

> "Which dashboard should this go into?"

Options: list each existing dashboard with its slug, title, and chart count, plus a "New dashboard" option.

Example format:
```
1. demographics — "Demographics" (0 charts)
2. geriatric — "Geriatric Health Dashboard" (3 charts)
3. global-trade — "Global Trade" (1 chart)
+ New dashboard
```

If "New dashboard" is chosen (or slug doesn't exist yet):
- Ask for a human-readable title (e.g. "Portfolio Tracker")
- Derive slug from title (kebab-case)
- Create `dashboards/<slug>/` with:
  - `adapters/.gitkeep`
  - `data/.gitkeep`
  - `dashboard.json` from the default template (see below)

Write `.session/context.json`:
```json
{ "dashboard": "<slug>" }
```

**This is the first artifact written. Write it before any other phase.**

## Step 1 — Handle stale session

If `bin/session-status` shows `has_session: true`, use **AskUserQuestion**:

> "Found an incomplete session for `<slug>` (<N> artifacts present). Resume it or start fresh?"

Options: **Resume** | **Start fresh**

If resuming: read existing `.session/` artifacts and jump to the appropriate phase (whichever artifact is missing next).
If starting fresh: delete all files in `.session/` (then re-write `context.json`).

## Step 2 — Discover goal (only required question)

Ask open-ended with no preset options:
> "What do you want to visualize?"

If the target dashboard has existing content, surface natural complements:
> "You already have [X] in `<slug>`. Want to add [complement], or something different?"

**Do not proceed without a clear answer.**

## Step 3 — Build datasource plan + adapter (one checkpoint)

Do all of this work **silently before asking anything**:

1. **Identify source type** from the goal. For any named external service (Stripe, AWS Cost Explorer, Datadog, etc.), use `WebSearch` then `WebFetch` to read the official API docs before writing code.

2. **Check for reusable adapters.** If `dashboards/<slug>/adapters/` has an existing adapter that fetches compatible data, plan to reuse or extend it.

3. **Draft the full adapter** including:
   - Connection and auth logic (using env vars from `.env`)
   - Field selection based on the stated goal
   - Initial transformations Claude can infer from the goal description
   - **Use `DASHBOARD_DIR` env var for all output paths:**
     ```python
     import os
     DASHBOARD_DIR = os.environ.get("DASHBOARD_DIR", f"dashboards/<slug>")
     os.makedirs(f"{DASHBOARD_DIR}/data", exist_ok=True)
     with open(f"{DASHBOARD_DIR}/data/<slug>.json", "w") as f: ...
     ```

4. **Write `.session/adapter.py`** with the draft.

5. **Run it:** `DASHBOARD_DIR=dashboards/<slug> python .session/adapter.py`

6. **Inspect the output.** Read `dashboards/<slug>/data/<slug>.json` and note:
   - Field names and inferred types (timestamp, currency amount, string category, numeric)
   - Value ranges and units
   - Null/missing patterns
   - Cardinality of categories, time range and granularity
   - Any transformations already applied

7. **If the adapter fails:** diagnose the error, fix the code, re-run. Attempt one self-correction before surfacing to the user.

8. **Derive adapter slug** from the stated goal (kebab-case). Example: "monthly AWS costs" → `monthly-aws-costs`.

Now present **one combined checkpoint** via **AskUserQuestion**:

```
Here's my datasource plan:

Source:      <source description>
Adapter:     dashboards/<dashboard>/adapters/<slug>.py
Slug:        <slug>
Fields:      <list of fields>
Transforms:  <list of transforms applied>

Data sample:
<first 3-5 rows of output>

Does this look right, or should I adjust anything?
```

Iterate (fix adapter + re-run) until the user confirms the data is correct.

Write `.session/datasource.json`:
```json
{
  "slug": "<adapter-slug>",
  "type": "<rest|athena|csv|other>",
  "source": "<human-readable data source, e.g. 'GitHub REST API (api.github.com/search/repositories)'>",
  "is_edit": false
}
```

## Step 3.5 — Propose interactive enhancements

After the datasource checkpoint is approved, inspect the confirmed data shape (fields, time range, categories, cardinality) and propose relevant interactive features via **AskUserQuestion** (multiSelect: true):

```
Your data has <describe shape — e.g. "24 months of time series across 3 categories">.
I can enhance the charts with:

☐ Annotations — mark key events on the timeline
☐ Time-frame selector — toggle between different time windows
☐ Category filter — show/hide individual series or categories
☐ Comparison overlay — overlay a second metric or time period

Which enhancements would you like? (select any, or skip)
```

**Only propose options that make sense for the data:**
- **Annotations**: only if data is a time series
- **Time-frame selector**: only if data spans > 1 month (uses ECharts `dataZoom`)
- **Category filter**: only if data has 3+ categories/series (uses ECharts `legend` with `selected`)
- **Comparison overlay**: only if there's a natural second dimension

If annotations are selected, follow up with one question asking the user to list key events (dates + labels), or offer to research notable events via `WebSearch`.

The selected enhancements inform Step 4's chart building — e.g. `dataZoom` for time-frame selectors, `legend` with `selected` for filtering, `markLine`/`markArea` for annotations.

If the user skips (selects no options), proceed to Step 4 with no enhancements.

## Step 4 — Build all charts (build first, ask second)

Do all of this work **before asking anything**:

1. Based on the confirmed data shape and goal, determine 2–4 chart variants. Do NOT ask the user which chart types to use.

2. Generate the **full ECharts `option` object** for every variant. The stored option is the complete template (axes, tooltip, legend, theme). The data arrays use placeholders (`"data": []`) that will be overwritten at render time by the adapter output.

3. Also update `.session/adapter.py` so its output format is a **partial ECharts option** that matches the chart's data structure. The adapter output is deep-merged into the stored option at render time.

   Example: if the chart has `series: [{type: "bar", data: []}]`, the adapter should write:
   ```json
   {"xAxis": {"data": ["EC2", "S3"]}, "series": [{"data": [124.5, 45.2]}]}
   ```

4. Write all variants to `.session/charts.json`.

5. Run `bin/start --preview` to open `http://localhost:5173/d/<slug>/preview`.

Now ask via **AskUserQuestion**:

```
I built <N> charts — open http://localhost:5173/d/<slug>/preview to see them:

1. "<Title>" — <chart type>, <one-line rationale>
2. "<Title>" — <chart type>, <one-line rationale>
3. "<Title>" — <chart type>, <one-line rationale>

Which would you like to keep? (all / pick by number / describe changes / generate more variants)
```

Options must always include:
- **All** — keep every chart
- **Individual picks** — numbered selections
- **Generate more variants** — build additional chart approaches before deciding
- **Exit without promoting** — abandon the session and clear `.session/`

If the user picks **Generate more variants**: build 1–2 additional chart types (different visual approach — e.g. if you built bars, try a scatter or heatmap), add them to `.session/charts.json`, re-open preview, and ask again.

If the user picks **Exit without promoting**: delete all files in `.session/` (including `context.json`) and delete any data files written to `dashboards/<slug>/data/` by this session. Stop.

Remove unchosen charts from `.session/charts.json`. If the user requests changes, update the relevant ECharts option and/or adapter, re-run, and ask again.

## Step 5 — Define placement (one checkpoint)

Read `dashboards/<slug>/dashboard.json` sections. Reason about the best placement for the chosen charts.

Draft a section title and a 1–2 sentence intro paragraph. Propose via **AskUserQuestion**:

```
I'll place these in a new section "<Section Name>" at the end of the dashboard:

  Row 1: "<Chart A>" — full width
  Row 2: "<Chart B>" — full width

Section title: "<Proposed Section Name>"
Intro text:    "<1-2 sentence description>"

Want to adjust the section title, intro text, layout, or position?
```

Options:
- **Looks good** — keep as proposed
- **Edit title / text** — change the section name or intro paragraph
- **Remove text** — no intro paragraph, just the charts
- **Go back** — return to chart selection

If the user picks **Edit title / text**, ask a follow-up for the new title and/or text content.
If the user picks **Remove text**, omit `text_block` from `placement.json`.

Write `.session/placement.json`:
```json
{
  "section": "<Section Name>",
  "section_is_new": true,
  "rows": [
    {"slots": [{"type": "chart", "chartId": "<id>", "width": "full"}]}
  ],
  "text_block": {
    "position": "before_first_row",
    "content": "<intro text>"
  }
}
```

## Step 6 — Confirm and promote

Show a final text summary:

```
Ready to add to dashboard:

  Dashboard:   <slug>
  Adapter:     dashboards/<slug>/adapters/<adapter-slug>.py
  Charts:      <list: title (type, placement)>
  Section:     <name> (new)
  Text block:  "<intro text>" (or "(none)" if removed)

Promote?
```

**AskUserQuestion**: **Yes, promote** | **Go back and adjust**

On approval: run `bin/promote` and report the git commit hash.

## Default dashboard.json template

When creating a new dashboard at `dashboards/<slug>/dashboard.json`:
```json
{
  "title": "<Human-readable title>",
  "description": "",
  "created_at": "<ISO8601>",
  "updated_at": "<ISO8601>",
  "theme": { "mode": "dark", "accent": "#00d4ff", "font": "JetBrains Mono" },
  "chart_height": 400,
  "sections": [],
  "charts": {}
}
```

## Guardrails

- **Never write to any `dashboard.json` directly.** Only `bin/promote` may modify it.
- **Never run `bin/promote` without the Step 6 confirmation.**
- **Never ask "what chart type do you want?"** before building. Build variants, then ask which to keep.
- **Never ask questions Claude can answer through data inspection or API research.**
- **Always write `.session/context.json` first** (before datasource.json, adapter.py, etc.)
- If the adapter fails on first run, attempt one self-correction before surfacing the error.
- Adapters MUST use `DASHBOARD_DIR` env var for output paths.
- All ECharts options must use the Bloomberg dark theme background (`#111827`), font (`JetBrains Mono`), and the dashboard accent color (`#00d4ff` unless `theme.accent` is different).
