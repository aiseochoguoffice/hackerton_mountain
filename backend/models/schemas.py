"""Pydantic 스키마 정의."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class MountainStats(BaseModel):
    accident_count: int = 0
    type_breakdown: dict[str, int] = Field(default_factory=dict)
    hour_breakdown: dict[str, int] = Field(default_factory=dict)
    season_breakdown: dict[str, int] = Field(default_factory=dict)
    rescued_total: int = 0
    air_rescue_count: int = 0
    air_rescue_ratio: float = 0.0


class MountainSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int | str
    name: str
    region_city: str
    region_district: str
    latitude: float
    longitude: float
    elevation_m: float
    difficulty: str
    risk_score: int
    risk_level: str
    stats: MountainStats


class MountainDetail(MountainSummary):
    aliases: list[str] = Field(default_factory=list)
    caution_notes: str = ""
    risk_updated_at: str | None = None


class AccidentType(BaseModel):
    id: int
    code: str
    name_ko: str
    description: str
    prevention_tips: str
    emergency_action: str
    icon_emoji: str
    share_pct: int = 0


class ChecklistItem(BaseModel):
    id: int
    category: str
    question_ko: str
    tip_ko: str
    weight: int
    is_critical: bool
    sort_order: int


class ChecklistEvaluateRequest(BaseModel):
    mountain_id: int | str | None = None
    answers: dict[str, bool] = Field(default_factory=dict)


class ChecklistEvaluateResponse(BaseModel):
    total_score: int
    risk_level: str
    advice: list[str]
    mountain_risk_score: int | None = None
    combined_level: str


class OverviewStats(BaseModel):
    total_accidents: int
    type_breakdown: dict[str, int]
    mapped_mountains: int
    generated_at: str
    total_mountains: int | None = None
    unmapped_accident_count: int | None = None
    match_rate_pct: float | None = None
    data_source: str | None = None
    source_breakdown: dict[str, int] | None = None
    match_methods: dict[str, int] | None = None
    status_count: int | None = None
    rescue_count: int | None = None
    unmapped_regions: int | None = None


class RiskMapPoint(BaseModel):
    id: int | str
    name: str
    latitude: float
    longitude: float
    risk_score: int
    risk_level: str
    accident_count: int
