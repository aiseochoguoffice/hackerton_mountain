"""mountains2.tsv 마스터 로더 및 소재지 파싱."""

from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
TSV_PATH = ROOT / "data" / "mountains2.tsv"

CITY_ALIASES: dict[str, str] = {
    "강원도": "강원특별자치도",
    "강원특별자치도": "강원특별자치도",
    "전라북도": "전북특별자치도",
    "전북특별자치도": "전북특별자치도",
    "제주도": "제주특별자치도",
    "제주특별자치도": "제주특별자치도",
    "경기": "경기도",
    "경남": "경상남도",
    "경북": "경상북도",
    "전남": "전라남도",
    "충남": "충청남도",
    "충북": "충청북도",
}

# 시도 대표 좌표 (centroid fallback)
SIDO_COORDS: dict[str, tuple[float, float]] = {
    "서울특별시": (37.5665, 126.9780),
    "부산광역시": (35.1796, 129.0756),
    "대구광역시": (35.8714, 128.6014),
    "인천광역시": (37.4563, 126.7052),
    "광주광역시": (35.1595, 126.8526),
    "대전광역시": (36.3504, 127.3845),
    "울산광역시": (35.5384, 129.3114),
    "세종특별자치시": (36.4800, 127.2890),
    "경기도": (37.4138, 127.5183),
    "강원특별자치도": (37.8228, 128.1555),
    "충청북도": (36.6357, 127.4917),
    "충청남도": (36.5184, 126.8000),
    "전북특별자치도": (35.7175, 127.1530),
    "전라남도": (34.8679, 126.9910),
    "경상북도": (36.4919, 128.8889),
    "경상남도": (35.4606, 128.2132),
    "제주특별자치도": (33.4890, 126.4983),
}


def normalize_city(name: str) -> str:
    name = re.sub(r"\s+", "", (name or "").strip())
    return CITY_ALIASES.get(name, name)


def normalize_part(text: str) -> str:
    return re.sub(r"\s+", "", (text or "").strip())


def parse_location_raw(location_raw: str) -> dict[str, str]:
    """소재지 문자열을 시/도·구/군·읍면동·리로 분리."""
    raw = re.sub(r"\s+", " ", (location_raw or "").strip())
    parts = raw.split(" ") if raw else []
    result = {
        "region_city": "",
        "region_district": "",
        "region_emd": "",
        "region_ri": "",
        "location_raw": raw,
    }
    if not parts:
        return result

    result["region_city"] = normalize_city(parts[0])
    if len(parts) >= 2:
        result["region_district"] = parts[1]
    if len(parts) >= 3:
        result["region_emd"] = parts[2]
    if len(parts) >= 4:
        result["region_ri"] = " ".join(parts[3:])
    return result


def location_key(city: str, district: str, emd: str = "", ri: str = "") -> str:
    return "|".join([
        normalize_city(city),
        normalize_part(district),
        normalize_part(emd),
        normalize_part(ri),
    ])


def normalize_mountain_name(name: str) -> tuple[str, str]:
    """산명 정규화: (base_name, peak_suffix)."""
    name = (name or "").strip()
    if "_" in name:
        base, peak = name.split("_", 1)
        return base.strip(), peak.strip()
    return name, ""


def read_mountains_tsv(path: Path = TSV_PATH) -> list[dict[str, Any]]:
    for enc in ("utf-16", "utf-8-sig", "cp949"):
        try:
            with open(path, encoding=enc, newline="") as f:
                return list(csv.DictReader(f, delimiter="\t"))
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise ValueError(f"TSV 인코딩을 읽을 수 없습니다: {path}")


def _approx_coords(city: str, code: str) -> tuple[float, float]:
    base = SIDO_COORDS.get(normalize_city(city), (36.5, 127.5))
    offset = (int(code[-4:]) % 100) / 500.0
    return round(base[0] + offset, 6), round(base[1] + offset, 6)


def load_mountains_master() -> list[dict[str, Any]]:
    rows = read_mountains_tsv()
    mountains: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("산코드", "")).strip()
        if not code:
            continue
        loc = parse_location_raw(row.get("소재지", ""))
        elev_raw = row.get("높이(m)", "0") or "0"
        try:
            elevation = float(elev_raw)
        except ValueError:
            elevation = 0.0
        base_name, peak = normalize_mountain_name(row.get("산명", ""))
        lat, lng = _approx_coords(loc["region_city"], code)
        mountains.append({
            "mountain_code": code,
            "name": row.get("산명", "").strip(),
            "base_name": base_name,
            "peak_suffix": peak,
            "subtitle": (row.get("산부제목정보") or "").strip(),
            "location_raw": loc["location_raw"],
            "region_city": loc["region_city"],
            "region_district": loc["region_district"],
            "region_emd": loc["region_emd"],
            "region_ri": loc["region_ri"],
            "location_key": location_key(
                loc["region_city"], loc["region_district"],
                loc["region_emd"], loc["region_ri"],
            ),
            "elevation_m": elevation,
            "manager_org": (row.get("관리주체명") or "").strip(),
            "manager_phone": (row.get("관리자전화번호") or "").strip(),
            "description": (row.get("산정보개관") or "").strip(),
            "latitude": lat,
            "longitude": lng,
            "geocode_quality": "approx",
            "difficulty": _guess_difficulty(elevation),
        })
    return mountains


def _guess_difficulty(elevation: float) -> str:
    if elevation >= 1500:
        return "EXPERT"
    if elevation >= 1000:
        return "HARD"
    if elevation >= 500:
        return "MODERATE"
    return "EASY"


def build_mountain_index(mountains: list[dict[str, Any]]) -> dict[str, Any]:
    """주소 매칭용 인덱스."""
    by_city_district: dict[str, list[dict]] = {}
    by_base_name: dict[str, list[dict]] = {}
    by_code: dict[str, dict] = {}

    for m in mountains:
        by_code[m["mountain_code"]] = m
        cd_key = f"{m['region_city']}|{normalize_part(m['region_district'])}"
        by_city_district.setdefault(cd_key, []).append(m)
        by_base_name.setdefault(m["base_name"], []).append(m)

    return {
        "by_code": by_code,
        "by_city_district": by_city_district,
        "by_base_name": by_base_name,
    }


def match_accident_to_mountain(
    row: dict[str, str],
    index: dict[str, Any],
) -> tuple[str | None, int]:
    """사고 레코드를 산코드에 매칭. (mountain_code, score)"""
    city = normalize_city(row.get("발생장소_시", ""))
    district = normalize_part(row.get("발생장소_구", ""))
    dong = normalize_part(row.get("발생장소_동", ""))
    ri = normalize_part(row.get("발생장소_리", ""))
    place_other = (row.get("사고장소기타내역") or "").strip()
    bunji = (row.get("번지") or "").strip()
    blob = f"{city} {district} {dong} {ri} {place_other}"

    candidates: list[tuple[int, str]] = []

    cd_key = f"{city}|{district}"
    pool = list(index["by_city_district"].get(cd_key, []))

    if not pool:
        for key, ms in index["by_city_district"].items():
            if key.startswith(f"{city}|"):
                pool.extend(ms)

    for m in pool:
        score = 0
        if m["region_city"] == city:
            score += 2
        if normalize_part(m["region_district"]) == district:
            score += 3
        emd = normalize_part(m["region_emd"])
        m_ri = normalize_part(m["region_ri"])
        if emd and (emd in dong or emd in ri or dong in emd):
            score += 5
        if m_ri and (m_ri in ri or ri in m_ri):
            score += 3
        if m["name"] in blob or m["base_name"] in blob:
            score += 10
        if place_other and (m["name"] in place_other or m["base_name"] in place_other):
            score += 10
        if bunji.startswith("산"):
            score += 2
        if score >= 5:
            candidates.append((score, m["mountain_code"]))

    if not candidates:
        for base_name, ms in index["by_base_name"].items():
            if base_name and base_name in blob:
                for m in ms:
                    s = 8
                    if m["region_city"] == city:
                        s += 2
                    candidates.append((s, m["mountain_code"]))

    if not candidates:
        return None, 0

    candidates.sort(key=lambda x: (-x[0], -index["by_code"][x[1]]["elevation_m"]))
    return candidates[0][1], candidates[0][0]
