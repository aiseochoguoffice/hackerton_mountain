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
    return _load("mountain_stats.json")


def get_accident_types() -> list[dict]:
    return _load("accident_types.json")


def get_checklist_items() -> list[dict]:
    return _load("checklist_items.json")


def get_overview() -> dict:
    return _load("overview.json")


def get_region_clusters() -> list[dict]:
    return _load("region_clusters.json")


def get_mountain_by_id(mountain_id: int) -> dict | None:
    for m in get_mountains():
        if m["id"] == mountain_id:
            return m
    return None
