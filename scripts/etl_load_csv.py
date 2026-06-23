"""소방청 CSV → JSON 집계 및 위험지수 계산 ETL 스크립트."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
JSON_DIR = ROOT / "json"

STATUS_CSV = DATA_DIR / "소방청_전국 산악사고 현황_20241231.csv"
RESCUE_CSV = DATA_DIR / "소방청_전국 산악사고 구조활동현황_20201231.csv"

CAUSE_MAP: dict[str, str] = {
    "실족추락": "SLIP_FALL",
    "사고부상_실족": "SLIP_FALL",
    "사고부상_추락": "SLIP_FALL",
    "사고부상_미끄러짐": "SLIP_FALL",
    "개인질환": "ILLNESS",
    "질환_탈진탈수": "ILLNESS",
    "질환_기타질환": "ILLNESS",
    "질환_심혈관계": "ILLNESS",
    "일반조난": "LOST",
    "사고부상_조난": "LOST",
    "기타산악": "OTHER",
    "기타": "OTHER",
    "기타 사고_기타사고": "OTHER",
    "사고부상_기타부상": "OTHER",
}

SEVERITY_SCORES = {
    "항공대 인계": 1.0,
    "구급대 인계": 0.6,
    "인명구조": 0.3,
    "현장처치": 0.2,
    "기타": 0.1,
}

SEASON_NAMES = {1: "겨울", 2: "겨울", 3: "봄", 4: "봄", 5: "봄", 6: "여름",
                7: "여름", 8: "여름", 9: "가을", 10: "가을", 11: "가을", 12: "겨울"}


def load_json(path: Path) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_csv(path: Path) -> list[dict[str, str]]:
    for enc in ("utf-8-sig", "cp949", "euc-kr"):
        try:
            with open(path, encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise ValueError(f"CSV 인코딩을 읽을 수 없습니다: {path}")


def normalize_cause(raw: str) -> str:
    raw = (raw or "").strip()
    if raw in CAUSE_MAP:
        return CAUSE_MAP[raw]
    if "실족" in raw or "추락" in raw or "미끄" in raw:
        return "SLIP_FALL"
    if "질환" in raw or "탈진" in raw or "탈수" in raw:
        return "ILLNESS"
    if "조난" in raw:
        return "LOST"
    return "OTHER"


def parse_hour(time_str: str) -> int | None:
    if not time_str:
        return None
    m = re.match(r"(\d{1,2})", time_str.strip())
    return int(m.group(1)) if m else None


def parse_month(date_str: str) -> int | None:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").month
    except ValueError:
        return None


def match_mountain(
    row: dict[str, str],
    mountains: list[dict],
) -> int | None:
    city = (row.get("발생장소_시") or "").strip()
    district = (row.get("발생장소_구") or "").strip()
    dong = (row.get("발생장소_동") or "").strip()
    ri = (row.get("발생장소_리") or "").strip()
    blob = f"{city} {district} {dong} {ri}"

    for m in mountains:
        if m["name"] in blob:
            return m["id"]
        for alias in m.get("aliases", []):
            if alias in blob:
                return m["id"]

    candidates: list[tuple[int, int]] = []
    for m in mountains:
        score = 0
        if m["region_city"] == city:
            score += 2
        if district in m.get("match_districts", []) or m["region_district"] == district:
            score += 3
        for d in m.get("match_dong", []):
            if d in dong or d in ri:
                score += 5
        if score >= 5:
            candidates.append((score, m["id"]))

    if candidates:
        candidates.sort(reverse=True)
        return candidates[0][1]
    return None


def calc_risk_score(stats: dict, max_count: int) -> tuple[int, str]:
    total = stats["accident_count"]
    if total == 0:
        return 0, "LOW"

    freq = min(total / max(max_count, 1), 1.0) * 40

    sev_total = stats.get("severity_total", 0)
    sev_ratio = sev_total / total if total else 0
    severity = sev_ratio * 30

    season_counts = stats.get("season_breakdown", {})
    peak_season = max(season_counts.values()) if season_counts else 0
    season_factor = (peak_season / total) * 15 if total else 0

    hour_counts = stats.get("hour_breakdown", {})
    peak_hours = sum(hour_counts.get(str(h), 0) for h in (14, 15, 16))
    hour_factor = (peak_hours / total) * 15 if total else 0

    score = round(min(freq + severity + season_factor + hour_factor, 100))
    if score <= 30:
        level = "LOW"
    elif score <= 60:
        level = "MEDIUM"
    elif score <= 80:
        level = "HIGH"
    else:
        level = "VERY_HIGH"
    return score, level


def build_caution_notes(stats: dict, type_names: dict[str, str]) -> str:
    total = stats["accident_count"]
    if total == 0:
        return "등록된 사고 데이터가 없습니다. 기본 안전 수칙을 준수하세요."

    type_breakdown = stats.get("type_breakdown", {})
    top_type = max(type_breakdown, key=type_breakdown.get) if type_breakdown else "SLIP_FALL"
    top_pct = round(type_breakdown.get(top_type, 0) / total * 100)

    hour_breakdown = stats.get("hour_breakdown", {})
    peak_hour = max(hour_breakdown, key=lambda h: hour_breakdown[h]) if hour_breakdown else "14"
    peak_hour_pct = round(hour_breakdown.get(peak_hour, 0) / total * 100) if hour_breakdown else 0

    season_breakdown = stats.get("season_breakdown", {})
    peak_season = max(season_breakdown, key=season_breakdown.get) if season_breakdown else "가을"
    peak_season_pct = round(season_breakdown.get(peak_season, 0) / total * 100) if season_breakdown else 0

    type_ko = type_names.get(top_type, top_type)
    notes = [
        f"주요 사고 유형: {type_ko} ({top_pct}%)",
        f"사고 집중 시간: {peak_hour}시대 ({peak_hour_pct}%)",
        f"사고 집중 계절: {peak_season} ({peak_season_pct}%)",
    ]
    if top_type == "SLIP_FALL":
        notes.append("미끄럼 방지 등산화 착용, 우천·결빙 시 등산 자제")
    elif top_type == "ILLNESS":
        notes.append("충분한 수분·휴식, 본인 체력에 맞는 코스 선택")
    elif top_type == "LOST":
        notes.append("등산로·일몰 시간 확인, GPS·지도 필수")
    else:
        notes.append("보호장비 착용, 낙석·벌 출몰 구간 주의")
    return " | ".join(notes)


def process_rows(
    rows: list[dict[str, str]],
    mountains: list[dict],
    cause_field: str,
    has_severity: bool,
) -> tuple[dict[int, dict], dict[str, dict], Counter]:
    mountain_stats: dict[int, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "severity_total": 0.0,
        "rescued_total": 0,
        "air_rescue_count": 0,
    })
    region_stats: dict[str, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "severity_total": 0.0,
        "region_city": "",
        "region_district": "",
    })
    unmapped = Counter()

    for row in rows:
        cause_raw = row.get(cause_field) or row.get("사고원인", "")
        cause = normalize_cause(cause_raw)
        hour = parse_hour(row.get("신고시각", ""))
        month = parse_month(row.get("신고년월일", ""))
        rescued = int(row.get("구조인원") or 0)

        mid = match_mountain(row, mountains)
        city = (row.get("발생장소_시") or "").strip()
        district = (row.get("발생장소_구") or "").strip()

        if mid:
            s = mountain_stats[mid]
        else:
            key = f"{city}|{district}"
            s = region_stats[key]
            s["region_city"] = city
            s["region_district"] = district
            unmapped[key] += 1

        s["accident_count"] += 1
        s["type_breakdown"][cause] += 1
        s["rescued_total"] = s.get("rescued_total", 0) + rescued

        if hour is not None:
            s["hour_breakdown"][str(hour)] += 1
        if month is not None:
            s["season_breakdown"][SEASON_NAMES[month]] += 1

        if has_severity:
            result = (row.get("처리결과코드") or "").strip()
            sev = SEVERITY_SCORES.get(result, 0.1)
            s["severity_total"] += sev
            if "항공" in result:
                s["air_rescue_count"] = s.get("air_rescue_count", 0) + 1
        else:
            s["severity_total"] += 0.3

    return mountain_stats, region_stats, unmapped


def counter_to_dict(c: Counter) -> dict:
    return dict(c)


def main() -> None:
    mountains: list[dict] = load_json(JSON_DIR / "mountains.json")
    accident_types: list[dict] = load_json(JSON_DIR / "accident_types.json")
    type_names = {t["code"]: t["name_ko"] for t in accident_types}

    status_rows = read_csv(STATUS_CSV)
    rescue_rows = read_csv(RESCUE_CSV)

    m_stats1, r_stats1, _ = process_rows(status_rows, mountains, "사고원인코드명_사고종별", True)
    m_stats2, r_stats2, unmapped = process_rows(rescue_rows, mountains, "사고원인", False)

    merged: dict[int, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "severity_total": 0.0,
        "rescued_total": 0,
        "air_rescue_count": 0,
    })

    for src in (m_stats1, m_stats2):
        for mid, s in src.items():
            m = merged[mid]
            m["accident_count"] += s["accident_count"]
            m["type_breakdown"].update(s["type_breakdown"])
            m["hour_breakdown"].update(s["hour_breakdown"])
            m["season_breakdown"].update(s["season_breakdown"])
            m["severity_total"] += s["severity_total"]
            m["rescued_total"] += s.get("rescued_total", 0)
            m["air_rescue_count"] += s.get("air_rescue_count", 0)

    max_count = max((s["accident_count"] for s in merged.values()), default=1)

    output_mountains: list[dict] = []
    for m in mountains:
        mid = m["id"]
        stats = merged.get(mid, {
            "accident_count": 0,
            "type_breakdown": Counter(),
            "hour_breakdown": Counter(),
            "season_breakdown": Counter(),
            "severity_total": 0.0,
            "rescued_total": 0,
            "air_rescue_count": 0,
        })
        risk_score, risk_level = calc_risk_score(stats, max_count)
        stat_dict = {
            "accident_count": stats["accident_count"],
            "type_breakdown": counter_to_dict(stats["type_breakdown"]),
            "hour_breakdown": counter_to_dict(stats["hour_breakdown"]),
            "season_breakdown": counter_to_dict(stats["season_breakdown"]),
            "rescued_total": stats.get("rescued_total", 0),
            "air_rescue_count": stats.get("air_rescue_count", 0),
            "air_rescue_ratio": round(
                stats.get("air_rescue_count", 0) / max(stats["accident_count"], 1), 3
            ),
        }
        output_mountains.append({
            **m,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "stats": stat_dict,
            "caution_notes": build_caution_notes(
                {"accident_count": stats["accident_count"], **stat_dict},
                type_names,
            ),
            "risk_updated_at": datetime.now().isoformat(),
        })

    output_mountains.sort(key=lambda x: x["risk_score"], reverse=True)

    region_clusters: list[dict] = []
    all_region: dict[str, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "severity_total": 0.0,
        "region_city": "",
        "region_district": "",
    })
    for src in (r_stats1, r_stats2):
        for key, s in src.items():
            all_region[key]["accident_count"] += s["accident_count"]
            all_region[key]["type_breakdown"].update(s["type_breakdown"])
            all_region[key]["hour_breakdown"].update(s["hour_breakdown"])
            all_region[key]["season_breakdown"].update(s["season_breakdown"])
            all_region[key]["severity_total"] += s["severity_total"]
            all_region[key]["region_city"] = s["region_city"]
            all_region[key]["region_district"] = s["region_district"]

    region_max = max((s["accident_count"] for s in all_region.values()), default=1)
    for i, (key, stats) in enumerate(
        sorted(all_region.items(), key=lambda x: x[1]["accident_count"], reverse=True)[:30]
    ):
        risk_score, risk_level = calc_risk_score(stats, region_max)
        region_clusters.append({
            "id": f"region_{i+1}",
            "name": f"{stats['region_city']} {stats['region_district']}",
            "region_city": stats["region_city"],
            "region_district": stats["region_district"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "accident_count": stats["accident_count"],
            "type_breakdown": counter_to_dict(stats["type_breakdown"]),
        })

    national_total = len(status_rows) + len(rescue_rows)
    national_types: Counter = Counter()
    for rows, field in [(status_rows, "사고원인코드명_사고종별"), (rescue_rows, "사고원인")]:
        for row in rows:
            national_types[normalize_cause(row.get(field, ""))] += 1

    overview = {
        "total_accidents": national_total,
        "status_count": len(status_rows),
        "rescue_count": len(rescue_rows),
        "type_breakdown": counter_to_dict(national_types),
        "mapped_mountains": sum(1 for m in output_mountains if m["stats"]["accident_count"] > 0),
        "unmapped_regions": len(unmapped),
        "generated_at": datetime.now().isoformat(),
    }

    save_json(JSON_DIR / "mountain_stats.json", output_mountains)
    save_json(JSON_DIR / "region_clusters.json", region_clusters)
    save_json(JSON_DIR / "overview.json", overview)

    frontend_public = ROOT / "frontend" / "public" / "data"
    save_json(frontend_public / "mountain_stats.json", output_mountains)
    save_json(frontend_public / "region_clusters.json", region_clusters)
    save_json(frontend_public / "overview.json", overview)
    save_json(frontend_public / "accident_types.json", accident_types)
    save_json(frontend_public / "checklist_items.json", load_json(JSON_DIR / "checklist_items.json"))

    print(f"ETL 완료: 산 {len(output_mountains)}개, 전국 사고 {national_total}건")
    print(f"매핑된 산: {overview['mapped_mountains']}개, 미매핑 지역: {overview['unmapped_regions']}개")


if __name__ == "__main__":
    main()
