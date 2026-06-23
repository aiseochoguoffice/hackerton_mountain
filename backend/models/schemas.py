"""Pydantic 스키마 정의."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MountainStats(BaseModel):
    accident_count: int = 0
    type_breakdown: dict[str, int] = Field(default_factory=dict)
    hour_breakdown: dict[str, int] = Field(default_factory=dict)
    season_breakdown: dict[str, int] = Field(default_factory=dict)
    year_breakdown: dict[str, int] = Field(default_factory=dict)
    source_breakdown: dict[str, int] = Field(default_factory=dict)
    rescued_total: int = 0
    air_rescue_count: int = 0
    air_rescue_ratio: float = 0.0


class ForecastMatch(BaseModel):
    mountain_num: str
    forecast_station_name: str
    match_method: str
    match_confidence: str


class MountainSummary(BaseModel):
    mountain_code: str
    name: str
    region_city: str
    region_district: str
    location_raw: str = ""
    latitude: float
    longitude: float
    elevation_m: float
    manager_org: str = ""
    manager_phone: str = ""
    risk_score: int
    risk_level: str
    stats: MountainStats


class MountainDetail(MountainSummary):
    base_name: str = ""
    subtitle: str = ""
    description: str = ""
    manager_org: str = ""
    manager_phone: str = ""
    geocode_quality: str = "approx"
    difficulty: str = "MODERATE"
    caution_notes: str = ""
    forecast_match: ForecastMatch | None = None
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
    mountain_code: str | None = None
    answers: dict[str, bool] = Field(default_factory=dict)


class ChecklistEvaluateResponse(BaseModel):
    total_score: int
    risk_level: str
    advice: list[str]
    mountain_risk_score: int | None = None
    combined_level: str


class OverviewStats(BaseModel):
    total_accidents: int
    source_breakdown: dict[str, int] = Field(default_factory=dict)
    type_breakdown: dict[str, int]
    mapped_mountains: int
    total_mountains: int
    unmapped_accident_count: int
    match_rate_pct: float
    generated_at: str


class RiskMapPoint(BaseModel):
    mountain_code: str
    name: str
    latitude: float
    longitude: float
    elevation_m: float
    manager_org: str = ""
    manager_phone: str = ""
    location_raw: str = ""
    risk_score: int
    risk_level: str
    accident_count: int


class WeatherForecastItem(BaseModel):
    category: str
    fcst_date: str
    fcst_time: str
    value: str


class MountainWeatherResponse(BaseModel):
    available: bool
    mountain_code: str | None = None
    forecast_station_name: str | None = None
    items: list[WeatherForecastItem] = Field(default_factory=list)
    message: str | None = None
