---
name: dashboard-refresh
description: Re-run data adapters to pull fresh data into dashboards/*/data/*.json. Optionally target a specific dashboard or adapter by slug.
---

Refresh data from adapters.

## Steps

1. Check if a specific dashboard slug or adapter slug was provided as an argument.

2. If a specific dashboard + adapter:
   - Verify `dashboards/<dashboard>/adapters/<adapter>.py` exists. If not, list available adapters and stop.
   - Run `bin/refresh-data --dashboard <dashboard> --adapter <adapter>`
   - Report result.

3. If a specific dashboard only:
   - Run `bin/refresh-data --dashboard <dashboard>`
   - Report per-adapter results.

4. If no argument:
   - **AskUserQuestion**: "Refresh all dashboards, a specific dashboard, or a specific adapter?"
     Options: **All dashboards** | **Choose a dashboard** | **Choose specific adapter**
   - Run accordingly:
     - All: `bin/refresh-data`
     - Dashboard: `bin/refresh-data --dashboard <slug>`
     - Adapter: `bin/refresh-data --dashboard <slug> --adapter <name>`

5. Report success/failure per adapter with `[slug] adapter-name` format.

## Notes

Data files are served at `/d/<slug>/data/<file>.json` by the dev server. The React dashboard polls these on each chart's `refresh_interval`. Running this command immediately updates the live data visible in the browser without restarting the server.
