"""JSON 데이터 로더."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
JSON_DIR = ROOT / "json"


@lru_cache
def _load(filename: str) -> list | dict:
    path = JSON_DIR / filename
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_mountains() -> list[dict]:
    path = JSON_DIR / "mountains_integrated.json"
    if path.exists():
        return _load("mountains_integrated.json")
    return _load("mountain_stats.json")


def get_accident_types() -> list[dict]:
    return _load("accident_types.json")


def get_checklist_items() -> list[dict]:
    return _load("checklist_items.json")


def get_overview() -> dict:
    return _load("overview.json")


def get_region_clusters() -> list[dict]:
    return _load("region_clusters.json")


def get_forecast_map() -> dict:
    path = JSON_DIR / "mountain_forecast_map.json"
    if not path.exists():
        return {}
    return _load("mountain_forecast_map.json")


def get_mountain_by_code(mountain_code: str) -> dict | None:
    for m in get_mountains():
        if m.get("mountain_code") == mountain_code or str(m.get("id")) == mountain_code:
            return m
    return None
