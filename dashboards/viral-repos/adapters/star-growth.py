"""
Fetch fastest-growing GitHub repos by star velocity over the last 3 years.
Star velocity = stargazers_count / days_since_creation
"""

import json
import os
import time
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

DASHBOARD_DIR = os.environ.get("DASHBOARD_DIR", "dashboards/viral-repos")
os.makedirs(f"{DASHBOARD_DIR}/data", exist_ok=True)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
if GITHUB_TOKEN:
    headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"


def search_repos(query: str, per_page: int = 30) -> list:
    resp = requests.get(
        "https://api.github.com/search/repositories",
        params={"q": query, "sort": "stars", "order": "desc", "per_page": per_page},
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    time.sleep(0.5)  # respect rate limits
    return resp.json().get("items", [])


now = datetime.now(timezone.utc)

# Fetch top repos created in each of the last 3 calendar years
year_batches = {
    "2022": search_repos("created:2022-01-01..2022-12-31 stars:>5000", per_page=30),
    "2023": search_repos("created:2023-01-01..2023-12-31 stars:>5000", per_page=30),
    "2024": search_repos("created:2024-01-01..2024-12-31 stars:>2000", per_page=30),
    "2025": search_repos("created:2025-01-01..2025-12-31 stars:>500", per_page=30),
}

all_repos = []
for year, repos in year_batches.items():
    for r in repos:
        created = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
        age_days = max((now - created).days, 1)
        velocity = r["stargazers_count"] / age_days
        all_repos.append({
            "name": r["name"],
            "full_name": r["full_name"],
            "stars": r["stargazers_count"],
            "forks": r["forks_count"],
            "language": r["language"] or "Other",
            "created_at": r["created_at"][:10],
            "age_days": age_days,
            "velocity": round(velocity, 1),
            "cohort": year,
            "description": (r.get("description") or "")[:80],
        })

# Deduplicate (repo could appear in multiple year queries if edge cases), keep highest velocity
seen = {}
for r in all_repos:
    fn = r["full_name"]
    if fn not in seen or r["velocity"] > seen[fn]["velocity"]:
        seen[fn] = r

all_repos = sorted(seen.values(), key=lambda x: -x["velocity"])

# Top 20 fastest growing
top20 = all_repos[:20]

print(f"Top {len(top20)} fastest-growing repos by star velocity:")
for i, r in enumerate(top20, 1):
    print(f"  {i:2d}. {r['full_name']:45s}  {r['velocity']:6.1f} ★/day  ★{r['stars']:>7,}  {r['cohort']}")

# ---------- Chart 1: Horizontal bar — star velocity ranking ----------
bar_names = [r["name"] for r in reversed(top20[:15])]
bar_vals = [r["velocity"] for r in reversed(top20[:15])]

with open(f"{DASHBOARD_DIR}/data/star-growth-velocity.json", "w") as f:
    json.dump({
        "yAxis": {"data": bar_names},
        "series": [{"data": bar_vals}],
    }, f, indent=2)

# ---------- Chart 2: Scatter — age vs stars, colored by cohort year ----------
cohort_colors = {"2022": "#00d4ff", "2023": "#6366f1", "2024": "#f59e0b", "2025": "#10b981"}
scatter_series = []
for year in ["2022", "2023", "2024", "2025"]:
    cohort_repos = [r for r in top20 if r["cohort"] == year]
    scatter_series.append({
        "name": year,
        "data": [
            {"value": [r["age_days"], r["stars"], r["velocity"]], "name": r["name"]}
            for r in cohort_repos
        ],
    })

with open(f"{DASHBOARD_DIR}/data/star-growth-scatter.json", "w") as f:
    json.dump({"series": scatter_series}, f, indent=2)

# ---------- Chart 3: Grouped bar — top repos per cohort year ----------
# Top 5 per year by stars
cohort_bars: dict[str, list] = {}
for year in ["2022", "2023", "2024", "2025"]:
    cohort_repos = sorted(
        [r for r in all_repos if r["cohort"] == year],
        key=lambda x: -x["velocity"]
    )[:5]
    cohort_bars[year] = cohort_repos

# Use repo names from the union of top-5 per year
all_names_ordered = []
seen_names: set = set()
for year in ["2022", "2023", "2024", "2025"]:
    for r in cohort_bars[year]:
        if r["name"] not in seen_names:
            all_names_ordered.append(r["name"])
            seen_names.add(r["name"])

velocity_by_name: dict[str, float] = {r["name"]: r["velocity"] for r in all_repos}

cohort_series = []
colors = ["#00d4ff", "#6366f1", "#f59e0b", "#10b981"]
for i, year in enumerate(["2022", "2023", "2024", "2025"]):
    year_names = {r["name"] for r in cohort_bars[year]}
    cohort_series.append({
        "name": year,
        "data": [
            velocity_by_name.get(n, 0) if n in year_names else 0
            for n in all_names_ordered
        ],
        "itemStyle": {"color": colors[i]},
    })

with open(f"{DASHBOARD_DIR}/data/star-growth-cohort.json", "w") as f:
    json.dump({
        "xAxis": {"data": all_names_ordered},
        "series": cohort_series,
    }, f, indent=2)

print(f"\nWrote 3 data files to {DASHBOARD_DIR}/data/")
