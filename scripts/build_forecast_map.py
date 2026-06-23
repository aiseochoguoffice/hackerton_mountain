"""산악예보 지점 ↔ mountains2 산명 매핑表 생성."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from mountain_master import load_mountains_master, normalize_mountain_name  # noqa: E402

JSON_DIR = ROOT / "json"
STATIONS_PATH = JSON_DIR / "mountain_forecast_stations.json"


def load_stations() -> list[dict]:
    if not STATIONS_PATH.exists():
        return []
    with open(STATIONS_PATH, encoding="utf-8") as f:
        return json.load(f)


def normalize_name(name: str) -> str:
    base, _ = normalize_mountain_name(name)
    return base.replace(" ", "").strip()


def build_map() -> dict[str, dict]:
    mountains = load_mountains_master()
    stations = load_stations()
    if not stations:
        print("예보 지점 목록 없음 — mountain_forecast_stations.json 을 PDF 부록으로 채워주세요.")
        return {}

    by_name: dict[str, list[dict]] = {}
    for st in stations:
        key = normalize_name(st.get("name", ""))
        by_name.setdefault(key, []).append(st)

    result: dict[str, dict] = {}
    for m in mountains:
        code = m["mountain_code"]
        base = normalize_name(m["base_name"])
        candidates = by_name.get(base, [])
        if not candidates:
            full = normalize_name(m["name"])
            candidates = by_name.get(full, [])

        if len(candidates) == 1:
            st = candidates[0]
            result[code] = {
                "mountain_num": st["mountain_num"],
                "forecast_station_name": st["name"],
                "match_method": "name_exact",
                "match_confidence": "high",
            }
        elif len(candidates) > 1:
            city = m["region_city"]
            matched = [c for c in candidates if city in (c.get("region") or "")]
            pick = matched[0] if len(matched) == 1 else max(
                candidates, key=lambda c: len(c.get("name", ""))
            )
            result[code] = {
                "mountain_num": pick["mountain_num"],
                "forecast_station_name": pick["name"],
                "match_method": "name_region" if matched else "name_disambiguated",
                "match_confidence": "medium",
            }

    return result


def main() -> None:
    mapping = build_map()
    out = JSON_DIR / "mountain_forecast_map.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"forecast map: {len(mapping)}개 산 매핑 → {out}")


if __name__ == "__main__":
    main()
