"""산악예보 API 프록시 (mountainNum은 산명 매핑表 사용)."""

from __future__ import annotations

import os
from datetime import datetime
from functools import lru_cache
from typing import Any

import httpx

from backend.services.data_loader import get_forecast_map, get_mountain_by_code

# PDF 가이드 URL — 배포 시 환경변수로 override
FORECAST_API_URL = os.getenv(
    "MOUNTAIN_FORECAST_API_URL",
    "https://apihub.kma.go.kr/api/typ02/openApi/MountainFcstService/getMountainFcst",
)


def _latest_base_datetime() -> tuple[str, str]:
    now = datetime.now()
    hours = [23, 20, 17, 14, 11, 8, 5, 2]
    h = now.hour
    base_h = 2
    for bh in hours:
        if h >= bh:
            base_h = bh
            break
    return now.strftime("%Y%m%d"), f"{base_h:02d}00"


@lru_cache(maxsize=256)
def _fetch_forecast_cached(mountain_num: str, base_date: str, base_time: str) -> dict[str, Any]:
    auth_key = os.getenv("MOUNTAIN_FORECAST_API_KEY", "")
    if not auth_key:
        return {"available": False, "message": "API 키 미설정"}

    params = {
        "mountainNum": mountain_num,
        "base_date": base_date,
        "base_time": base_time,
        "authKey": auth_key,
        "dataType": "JSON",
        "numOfRows": 100,
        "pageNo": 1,
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(FORECAST_API_URL, params=params)
            resp.raise_for_status()
            return {"available": True, "raw": resp.json()}
    except Exception as exc:
        return {"available": False, "message": str(exc)}


def get_mountain_weather(mountain_code: str) -> dict[str, Any]:
    mountain = get_mountain_by_code(mountain_code)
    if not mountain:
        return {"available": False, "message": "산을 찾을 수 없습니다."}

    fm = mountain.get("forecast_match") or get_forecast_map().get(mountain_code)
    if not fm or not fm.get("mountain_num"):
        return {
            "available": False,
            "mountain_code": mountain_code,
            "message": "산악예보 지점과 연결되지 않았습니다.",
        }

    base_date, base_time = _latest_base_datetime()
    result = _fetch_forecast_cached(fm["mountain_num"], base_date, base_time)
    if not result.get("available"):
        return {
            "available": False,
            "mountain_code": mountain_code,
            "forecast_station_name": fm.get("forecast_station_name"),
            "message": result.get("message", "예보 조회 실패"),
        }

    items: list[dict] = []
    raw = result.get("raw", {})
    body = raw.get("response", {}).get("body", {})
    item_list = body.get("items", {}).get("item", [])
    if isinstance(item_list, dict):
        item_list = [item_list]
    for it in item_list[:20]:
        items.append({
            "category": it.get("category", ""),
            "fcst_date": it.get("fcstDate", it.get("fcst_date", "")),
            "fcst_time": it.get("fcstTime", it.get("fcst_time", "")),
            "value": str(it.get("fcstValue", it.get("fcst_value", ""))),
        })

    return {
        "available": True,
        "mountain_code": mountain_code,
        "forecast_station_name": fm.get("forecast_station_name"),
        "items": items,
        "message": None,
    }
