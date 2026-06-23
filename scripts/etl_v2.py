"""전국 산악사고 통합 CSV + mountains2 기반 ETL v2."""

from __future__ import annotations

import csv
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from mountain_master import (  # noqa: E402
    build_mountain_index,
    load_mountains_master,
    match_accident_to_mountain,
)
from etl_load_csv import (  # noqa: E402
    SEVERITY_SCORES,
    SEASON_NAMES,
    build_caution_notes,
    calc_risk_score,
    counter_to_dict,
    load_json,
    normalize_cause,
    parse_hour,
    parse_month,
    save_json,
)

DATA_DIR = ROOT / "data"
JSON_DIR = ROOT / "json"
INTEGRATED_CSV = DATA_DIR / "전국_산악사고_통합.csv"


def read_integrated_csv(path: Path) -> list[dict[str, str]]:
    for enc in ("utf-8-sig", "cp949", "utf-16"):
        try:
            with open(path, encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise ValueError(f"CSV 인코딩을 읽을 수 없습니다: {path}")


def process_integrated(
    rows: list[dict[str, str]],
    index: dict,
) -> tuple[dict[str, dict], dict[str, dict], dict[str, int], int]:
    mountain_stats: dict[str, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "year_breakdown": Counter(),
        "source_breakdown": Counter(),
        "severity_total": 0.0,
        "rescued_total": 0,
        "air_rescue_count": 0,
    })
    region_stats: dict[str, dict] = defaultdict(lambda: {
        "accident_count": 0,
        "type_breakdown": Counter(),
        "hour_breakdown": Counter(),
        "season_breakdown": Counter(),
        "year_breakdown": Counter(),
        "source_breakdown": Counter(),
        "severity_total": 0.0,
        "rescued_total": 0,
        "air_rescue_count": 0,
        "region_city": "",
        "region_district": "",
    })
    score_distribution: Counter = Counter()
    unmapped_count = 0

    for row in rows:
        cause_raw = row.get("사고원인코드명_사고종별") or row.get("사고원인", "")
        cause = normalize_cause(cause_raw)
        hour = parse_hour(row.get("신고시각", ""))
        month = parse_month(row.get("신고년월일", ""))
        year = (row.get("신고년월일") or "")[:4]
        source = row.get("데이터출처", "")
        rescued = int(row.get("구조인원") or 0)

        code, score = match_accident_to_mountain(row, index)
        city = (row.get("발생장소_시") or "").strip()
        district = (row.get("발생장소_구") or "").strip()

        if code:
            s = mountain_stats[code]
            score_distribution[score] += 1
        else:
            key = f"{city}|{district}"
            s = region_stats[key]
            s["region_city"] = city
            s["region_district"] = district
            unmapped_count += 1

        s["accident_count"] += 1
        s["type_breakdown"][cause] += 1
        s["rescued_total"] = s.get("rescued_total", 0) + rescued
        if hour is not None:
            s["hour_breakdown"][str(hour)] += 1
        if month is not None:
            s["season_breakdown"][SEASON_NAMES[month]] += 1
        if year:
            s["year_breakdown"][year] += 1
        if source:
            s["source_breakdown"][source] += 1

        result = (row.get("처리결과코드") or "").strip()
        sev = SEVERITY_SCORES.get(result, 0.1)
        s["severity_total"] += sev
        if "항공" in result:
            s["air_rescue_count"] = s.get("air_rescue_count", 0) + 1

    return mountain_stats, region_stats, dict(score_distribution), unmapped_count


def main() -> None:
    mountains = load_mountains_master()
    index = build_mountain_index(mountains)
    accident_types = load_json(JSON_DIR / "accident_types.json")
    type_names = {t["code"]: t["name_ko"] for t in accident_types}

    forecast_map: dict = {}
    forecast_path = JSON_DIR / "mountain_forecast_map.json"
    if forecast_path.exists():
        forecast_map = load_json(forecast_path)

    rows = read_integrated_csv(INTEGRATED_CSV)
    m_stats, r_stats, score_dist, unmapped_count = process_integrated(rows, index)

    max_count = max((s["accident_count"] for s in m_stats.values()), default=1)

    output: list[dict] = []
    for m in mountains:
        code = m["mountain_code"]
        stats = m_stats.get(code, {
            "accident_count": 0,
            "type_breakdown": Counter(),
            "hour_breakdown": Counter(),
            "season_breakdown": Counter(),
            "year_breakdown": Counter(),
            "source_breakdown": Counter(),
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
            "year_breakdown": counter_to_dict(stats.get("year_breakdown", Counter())),
            "source_breakdown": counter_to_dict(stats.get("source_breakdown", Counter())),
            "rescued_total": stats.get("rescued_total", 0),
            "air_rescue_count": stats.get("air_rescue_count", 0),
            "air_rescue_ratio": round(
                stats.get("air_rescue_count", 0) / max(stats["accident_count"], 1), 3
            ),
        }
        fm = forecast_map.get(code, {})
        output.append({
            **m,
            "id": code,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "stats": stat_dict,
            "caution_notes": build_caution_notes(
                {"accident_count": stats["accident_count"], **stat_dict},
                type_names,
            ),
            "forecast_match": fm if fm else None,
            "risk_updated_at": datetime.now().isoformat(),
        })

    output.sort(key=lambda x: (-x["risk_score"], -x["stats"]["accident_count"]))

    region_clusters = []
    region_max = max((s["accident_count"] for s in r_stats.values()), default=1)
    for i, (key, stats) in enumerate(
        sorted(r_stats.items(), key=lambda x: x[1]["accident_count"], reverse=True)[:50]
    ):
        rs, rl = calc_risk_score(stats, region_max)
        region_clusters.append({
            "id": f"region_{i+1}",
            "name": f"{stats['region_city']} {stats['region_district']}",
            "region_city": stats["region_city"],
            "region_district": stats["region_district"],
            "risk_score": rs,
            "risk_level": rl,
            "accident_count": stats["accident_count"],
            "type_breakdown": counter_to_dict(stats["type_breakdown"]),
        })

    national_types: Counter = Counter()
    source_counts: Counter = Counter()
    for row in rows:
        cause = normalize_cause(
            row.get("사고원인코드명_사고종별") or row.get("사고원인", "")
        )
        national_types[cause] += 1
        source_counts[row.get("데이터출처", "")] += 1

    mapped_with_accidents = sum(1 for m in output if m["stats"]["accident_count"] > 0)
    overview = {
        "total_accidents": len(rows),
        "source_breakdown": counter_to_dict(source_counts),
        "type_breakdown": counter_to_dict(national_types),
        "mapped_mountains": mapped_with_accidents,
        "total_mountains": len(output),
        "unmapped_accident_count": unmapped_count,
        "match_rate_pct": round((len(rows) - unmapped_count) / max(len(rows), 1) * 100, 1),
        "generated_at": datetime.now().isoformat(),
    }

    match_report = {
        "total_accidents": len(rows),
        "matched": len(rows) - unmapped_count,
        "unmapped": unmapped_count,
        "match_rate_pct": overview["match_rate_pct"],
        "score_distribution": score_dist,
        "generated_at": datetime.now().isoformat(),
    }

    save_json(JSON_DIR / "mountains_integrated.json", output)
    save_json(JSON_DIR / "mountain_stats.json", output)
    save_json(JSON_DIR / "region_clusters.json", region_clusters)
    save_json(JSON_DIR / "overview.json", overview)
    save_json(JSON_DIR / "accident_match_report.json", match_report)
    save_json(JSON_DIR / "unmapped_accidents_summary.json", region_clusters[:20])

    pub = ROOT / "frontend" / "public" / "data"
    for name, data in [
        ("mountains_integrated.json", output),
        ("mountain_stats.json", output),
        ("region_clusters.json", region_clusters),
        ("overview.json", overview),
        ("accident_match_report.json", match_report),
        ("accident_types.json", accident_types),
        ("checklist_items.json", load_json(JSON_DIR / "checklist_items.json")),
    ]:
        save_json(pub / name, data)

    print(f"ETL v2 완료: 산 {len(output)}개, 사고 {len(rows)}건")
    print(f"매칭률: {overview['match_rate_pct']}% ({mapped_with_accidents}개 산에 사고 집계)")


if __name__ == "__main__":
    main()
