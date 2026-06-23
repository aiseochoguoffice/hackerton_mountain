"""체크리스트 평가 및 위험 등급 계산."""

from __future__ import annotations

from backend.services.data_loader import get_checklist_items, get_mountain_by_id

ADVICE_BY_CATEGORY: dict[str, str] = {
    "EQUIPMENT": "등산 장비(등산화, 손전등, 우비)를 반드시 준비하세요.",
    "HEALTH": "컨디션이 좋지 않다면 등산을 연기하세요.",
    "WEATHER": "기상특보·일몰 시간을 확인하고 일정을 조정하세요.",
    "COMPANION": "동행자와 등산 계획을 공유하세요.",
    "ROUTE": "코스·소요시간·비상연락처를 사전에 확인하세요.",
}

MOUNTAIN_ADVICE: dict[str, str] = {
    "SLIP_FALL": "미끄럼 방지 등산화와 지팡이를 사용하세요.",
    "ILLNESS": "수분·간식을 충분히 준비하고 휴식을 자주 취하세요.",
    "LOST": "등산 앱·지도로 경로를 확인하고 일몰 전 하산하세요.",
    "OTHER": "보호장비를 착용하고 위험 구간을 주의하세요.",
}


def _score_to_level(score: int) -> str:
    if score >= 80:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


def evaluate_checklist(
    answers: dict[str, bool],
    mountain_id: int | None = None,
) -> dict:
    items = get_checklist_items()
    max_score = sum(i["weight"] for i in items)
    earned = 0
    advice: list[str] = []
    failed_critical = False
    failed_categories: set[str] = set()

    for item in items:
        key = str(item["id"])
        checked = answers.get(key, False)
        if checked:
            earned += item["weight"]
        else:
            failed_categories.add(item["category"])
            if item["is_critical"]:
                failed_critical = True
                advice.append(f"[필수] {item['question_ko']} — {item['tip_ko']}")

    total_score = round(earned / max_score * 100) if max_score else 0
    prep_level = "LOW" if failed_critical else _score_to_level(total_score)

    for cat in failed_categories:
        if cat in ADVICE_BY_CATEGORY:
            msg = ADVICE_BY_CATEGORY[cat]
            if msg not in advice:
                advice.append(msg)

    mountain_risk_score: int | None = None
    combined_level = prep_level

    if mountain_id:
        mountain = get_mountain_by_id(mountain_id)
        if mountain:
            mountain_risk_score = mountain["risk_score"]
            stats = mountain.get("stats", {})
            type_breakdown = stats.get("type_breakdown", {})
            if type_breakdown:
                top_type = max(type_breakdown, key=type_breakdown.get)
                tip = MOUNTAIN_ADVICE.get(top_type)
                if tip:
                    advice.insert(0, f"[{mountain['name']}] {tip}")
            advice.insert(0, f"[{mountain['name']}] 위험지수 {mountain_risk_score}점 ({mountain['risk_level']})")

            if mountain_risk_score >= 61 and prep_level != "LOW":
                combined_level = "HIGH"
            elif mountain_risk_score >= 31 or prep_level == "MEDIUM":
                combined_level = "MEDIUM" if prep_level != "HIGH" else "HIGH"
            else:
                combined_level = prep_level

    if not advice:
        advice.append("준비가 잘 되어 있습니다. 안전 수칙을 지키며 즐거운 등산 되세요!")

    return {
        "total_score": total_score,
        "risk_level": prep_level,
        "advice": advice[:8],
        "mountain_risk_score": mountain_risk_score,
        "combined_level": combined_level,
    }
