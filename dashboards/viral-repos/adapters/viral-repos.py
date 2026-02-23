"""Fetch top 10 most-starred GitHub repositories and write chart data files."""

import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()

DASHBOARD_DIR = os.environ.get("DASHBOARD_DIR", "dashboards/viral-repos")
os.makedirs(f"{DASHBOARD_DIR}/data", exist_ok=True)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
headers = {"Accept": "application/vnd.github+json"}
if GITHUB_TOKEN:
    headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

# Fetch top 10 repos by star count
resp = requests.get(
    "https://api.github.com/search/repositories",
    params={"q": "stars:>100000", "sort": "stars", "order": "desc", "per_page": 10},
    headers=headers,
    timeout=30,
)
resp.raise_for_status()
repos = resp.json()["items"]

# Build data for each chart

# --- Chart 1: Star count bar chart ---
names = [r["full_name"].split("/")[1] for r in repos]
stars = [r["stargazers_count"] for r in repos]

bar_data = {
    "yAxis": {"data": names[::-1]},
    "series": [{"data": stars[::-1]}],
}

with open(f"{DASHBOARD_DIR}/data/viral-repos-stars.json", "w") as f:
    json.dump(bar_data, f, indent=2)

# --- Chart 2: Stars vs Forks scatter ---
scatter_data = {
    "series": [
        {
            "data": [
                {
                    "value": [r["stargazers_count"], r["forks_count"]],
                    "name": r["full_name"].split("/")[1],
                }
                for r in repos
            ]
        }
    ],
}

with open(f"{DASHBOARD_DIR}/data/viral-repos-scatter.json", "w") as f:
    json.dump(scatter_data, f, indent=2)

# --- Chart 3: Language breakdown pie ---
lang_counts: dict[str, int] = {}
for r in repos:
    lang = r["language"] or "Other"
    lang_counts[lang] = lang_counts.get(lang, 0) + 1

pie_data = {
    "series": [
        {
            "data": [{"value": v, "name": k} for k, v in sorted(lang_counts.items(), key=lambda x: -x[1])]
        }
    ],
}

with open(f"{DASHBOARD_DIR}/data/viral-repos-languages.json", "w") as f:
    json.dump(pie_data, f, indent=2)

print(f"Wrote 3 data files to {DASHBOARD_DIR}/data/")
for r in repos:
    print(f"  {r['full_name']:40s}  ★ {r['stargazers_count']:>8,}  forks {r['forks_count']:>7,}  lang={r['language'] or 'n/a'}")
