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
    OverviewStats,
    RiskMapPoint,
)
from backend.services.checklist_engine import evaluate_checklist
from backend.services.data_loader import (
    get_accident_types,
    get_checklist_items,
    get_mountain_by_id,
    get_mountains,
    get_overview,
)

router = APIRouter(prefix="/api")


@router.get("/mountains", response_model=list[MountainSummary])
def list_mountains(
    q: str | None = Query(None, description="산 이름 검색"),
    region: str | None = Query(None, description="시도 필터"),
    risk_level: str | None = Query(None, description="위험 등급 필터"),
) -> list[MountainSummary]:
    mountains = get_mountains()
    if q:
        mountains = [
            m for m in mountains
            if q.lower() in m["name"].lower()
            or any(q.lower() in a.lower() for a in m.get("aliases", []))
        ]
    if region:
        mountains = [m for m in mountains if region in m["region_city"]]
    if risk_level:
        mountains = [m for m in mountains if m["risk_level"] == risk_level.upper()]
    return mountains


@router.get("/mountains/{mountain_id}", response_model=MountainDetail)
def get_mountain(mountain_id: str) -> MountainDetail:
    mountain = get_mountain_by_id(mountain_id)
    if not mountain:
        raise HTTPException(status_code=404, detail="산을 찾을 수 없습니다.")
    return mountain


@router.get("/accident-types", response_model=list[AccidentType])
def list_accident_types() -> list[AccidentType]:
    return get_accident_types()


@router.get("/checklist/items", response_model=list[ChecklistItem])
def list_checklist_items() -> list[ChecklistItem]:
    return sorted(get_checklist_items(), key=lambda x: x["sort_order"])


@router.post("/checklist/evaluate", response_model=ChecklistEvaluateResponse)
def evaluate(body: ChecklistEvaluateRequest) -> ChecklistEvaluateResponse:
    result = evaluate_checklist(body.answers, body.mountain_id)
    return ChecklistEvaluateResponse(**result)


@router.get("/stats/overview", response_model=OverviewStats)
def stats_overview() -> OverviewStats:
    return get_overview()


@router.get("/risk-map", response_model=list[RiskMapPoint])
def risk_map() -> list[RiskMapPoint]:
    points = []
    for m in get_mountains():
        if m["stats"]["accident_count"] == 0:
            continue
        points.append(
            RiskMapPoint(
                id=m["id"],
                name=m["name"],
                latitude=m["latitude"],
                longitude=m["longitude"],
                risk_score=m["risk_score"],
                risk_level=m["risk_level"],
                accident_count=m["stats"]["accident_count"],
            )
        )
    return points
