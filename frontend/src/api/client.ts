import type {
  AccidentType,
  ChecklistItem,
  ChecklistResult,
  Mountain,
  Overview,
  RiskMapPoint,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_STATIC = !API_BASE;

async function fetchStatic<T>(staticPath: string): Promise<T> {
  const res = await fetch(staticPath);
  if (!res.ok) throw new Error(`데이터 로드 실패: ${staticPath}`);
  return res.json();
}

async function fetchJson<T>(apiPath: string, staticPath: string): Promise<T> {
  if (USE_STATIC) {
    return fetchStatic<T>(staticPath);
  }
  try {
    const res = await fetch(`${API_BASE}${apiPath}`);
    if (!res.ok) throw new Error(`API 오류: ${apiPath} (${res.status})`);
    return res.json();
  } catch {
    console.warn(`API 실패, 정적 JSON fallback: ${staticPath}`);
    return fetchStatic<T>(staticPath);
  }
}

export async function getMountains(params?: {
  q?: string;
  region?: string;
  risk_level?: string;
}): Promise<Mountain[]> {
  let data: Mountain[];
  if (USE_STATIC) {
    data = await fetchStatic<Mountain[]>('/data/mountain_stats.json');
  } else {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.region) search.set('region', params.region);
    if (params?.risk_level) search.set('risk_level', params.risk_level);
    const qs = search.toString();
    data = await fetchJson<Mountain[]>(
      `/api/mountains${qs ? `?${qs}` : ''}`,
      '/data/mountain_stats.json',
    );
  }
  if (params?.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.aliases?.some((a) => a.toLowerCase().includes(q)),
    );
  }
  if (params?.region) {
    data = data.filter((m) => m.region_city.includes(params.region!));
  }
  if (params?.risk_level) {
    data = data.filter((m) => m.risk_level === params.risk_level!.toUpperCase());
  }
  return data;
}

export async function getMountain(id: number): Promise<Mountain | undefined> {
  if (USE_STATIC) {
    const all = await fetchStatic<Mountain[]>('/data/mountain_stats.json');
    return all.find((m) => m.id === id);
  }
  try {
    const res = await fetch(`${API_BASE}/api/mountains/${id}`);
    if (res.ok) return res.json();
  } catch {
    /* fallback */
  }
  const all = await fetchStatic<Mountain[]>('/data/mountain_stats.json');
  return all.find((m) => m.id === id);
}

export async function getAccidentTypes(): Promise<AccidentType[]> {
  return fetchJson('/api/accident-types', '/data/accident_types.json');
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const items = await fetchJson<ChecklistItem[]>('/api/checklist/items', '/data/checklist_items.json');
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export async function getOverview(): Promise<Overview> {
  return fetchJson('/api/stats/overview', '/data/overview.json');
}

export async function getRiskMap(): Promise<RiskMapPoint[]> {
  if (USE_STATIC) {
    const mountains = await fetchStatic<Mountain[]>('/data/mountain_stats.json');
    return mountains
      .filter((m) => m.stats.accident_count > 0)
      .map((m) => ({
        id: m.id,
        name: m.name,
        latitude: m.latitude,
        longitude: m.longitude,
        risk_score: m.risk_score,
        risk_level: m.risk_level,
        accident_count: m.stats.accident_count,
      }));
  }
  return fetchJson('/api/risk-map', '/data/mountain_stats.json');
}

export async function evaluateChecklist(
  answers: Record<string, boolean>,
  mountainId?: number,
): Promise<ChecklistResult> {
  if (USE_STATIC) {
    return evaluateChecklistLocal(answers, mountainId);
  }
  try {
    const res = await fetch(`${API_BASE}/api/checklist/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, mountain_id: mountainId ?? null }),
    });
    if (res.ok) return res.json();
  } catch {
    /* fallback */
  }
  return evaluateChecklistLocal(answers, mountainId);
}

async function evaluateChecklistLocal(
  answers: Record<string, boolean>,
  mountainId?: number,
): Promise<ChecklistResult> {
  const items = await getChecklistItems();
  const mountains = mountainId ? await getMountain(mountainId) : undefined;
  const maxScore = items.reduce((s, i) => s + i.weight, 0);
  let earned = 0;
  const advice: string[] = [];
  let failedCritical = false;

  for (const item of items) {
    if (answers[String(item.id)]) {
      earned += item.weight;
    } else if (item.is_critical) {
      failedCritical = true;
      advice.push(`[필수] ${item.question_ko} — ${item.tip_ko}`);
    }
  }

  const totalScore = maxScore ? Math.round((earned / maxScore) * 100) : 0;
  const prepLevel = failedCritical ? 'HIGH' : totalScore >= 80 ? 'LOW' : totalScore >= 50 ? 'MEDIUM' : 'HIGH';

  if (mountains) {
    advice.unshift(`[${mountains.name}] 위험지수 ${mountains.risk_score}점 (${mountains.risk_level})`);
  }
  if (!advice.length) advice.push('준비가 잘 되어 있습니다. 안전 수칙을 지키며 즐거운 등산 되세요!');

  let combinedLevel = prepLevel;
  if (mountains && mountains.risk_score >= 61 && prepLevel !== 'LOW') combinedLevel = 'HIGH';
  else if (mountains && mountains.risk_score >= 31) combinedLevel = prepLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';

  return {
    total_score: totalScore,
    risk_level: prepLevel,
    advice: advice.slice(0, 8),
    mountain_risk_score: mountains?.risk_score ?? null,
    combined_level: combinedLevel,
  };
}
