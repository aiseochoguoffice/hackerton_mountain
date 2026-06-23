"""API 라우터."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import (
    AccidentType,
    ChecklistEvaluateRequest,
    ChecklistEvaluateResponse,
    ChecklistItem,
    MountainDetail,
    MountainSummary,
    MountainWeatherResponse,
    OverviewStats,
    RiskMapPoint,
)
from backend.services.checklist_engine import evaluate_checklist
from backend.services.data_loader import (
    get_accident_types,
    get_checklist_items,
    get_mountain_by_code,
    get_mountains,
    get_overview,
)
from backend.services.mountain_weather import get_mountain_weather

router = APIRouter(prefix="/api")


@router.get("/mountains", response_model=list[MountainSummary])
def list_mountains(
    q: str | None = Query(None, description="산 이름 검색"),
    region: str | None = Query(None, description="시도 필터"),
    risk_level: str | None = Query(None, description="위험 등급 필터"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=5000),
) -> list[MountainSummary]:
    mountains = get_mountains()
    if q:
        ql = q.lower()
        mountains = [
            m for m in mountains
            if ql in m["name"].lower()
            or ql in m.get("location_raw", "").lower()
            or ql in m.get("base_name", "").lower()
        ]
    if region:
        mountains = [m for m in mountains if region in m["region_city"]]
    if risk_level:
        mountains = [m for m in mountains if m["risk_level"] == risk_level.upper()]

    start = (page - 1) * size
    return mountains[start : start + size]


@router.get("/mountains/{mountain_code}", response_model=MountainDetail)
def get_mountain(mountain_code: str) -> MountainDetail:
    mountain = get_mountain_by_code(mountain_code)
    if not mountain:
        raise HTTPException(status_code=404, detail="산을 찾을 수 없습니다.")
    return mountain


@router.get("/mountains/{mountain_code}/weather", response_model=MountainWeatherResponse)
def mountain_weather(mountain_code: str) -> MountainWeatherResponse:
    return get_mountain_weather(mountain_code)


@router.get("/accident-types", response_model=list[AccidentType])
def list_accident_types() -> list[AccidentType]:
    return get_accident_types()


@router.get("/checklist/items", response_model=list[ChecklistItem])
def list_checklist_items() -> list[ChecklistItem]:
    return sorted(get_checklist_items(), key=lambda x: x["sort_order"])


@router.post("/checklist/evaluate", response_model=ChecklistEvaluateResponse)
def evaluate(body: ChecklistEvaluateRequest) -> ChecklistEvaluateResponse:
    result = evaluate_checklist(body.answers, body.mountain_code)
    return ChecklistEvaluateResponse(**result)


@router.get("/stats/overview", response_model=OverviewStats)
def stats_overview() -> OverviewStats:
    return get_overview()


@router.get("/risk-map", response_model=list[RiskMapPoint])
def risk_map(
    min_accidents: int = Query(0, ge=0),
) -> list[RiskMapPoint]:
    points = []
    for m in get_mountains():
        cnt = m["stats"]["accident_count"]
        if cnt < min_accidents:
            continue
        points.append(
            RiskMapPoint(
                mountain_code=m["mountain_code"],
                name=m["name"],
                latitude=m["latitude"],
                longitude=m["longitude"],
                elevation_m=m.get("elevation_m", 0),
                manager_org=m.get("manager_org", ""),
                manager_phone=m.get("manager_phone", ""),
                location_raw=m.get("location_raw", ""),
                risk_score=m["risk_score"],
                risk_level=m["risk_level"],
                accident_count=cnt,
            )
        )
    return points
