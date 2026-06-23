import type {
  AccidentType,
  ChecklistItem,
  ChecklistResult,
  Mountain,
  MountainWeather,
  Overview,
  RiskMapPoint,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_STATIC = !API_BASE;

async function fetchJson<T>(apiPath: string, staticPath: string): Promise<T> {
  if (USE_STATIC) {
    const res = await fetch(staticPath);
    if (!res.ok) throw new Error(`데이터 로드 실패: ${staticPath}`);
    return res.json();
  }
  const res = await fetch(`${API_BASE}${apiPath}`);
  if (!res.ok) throw new Error(`API 오류: ${apiPath}`);
  return res.json();
}

let mountainsCache: Mountain[] | null = null;

async function loadAllMountains(): Promise<Mountain[]> {
  if (!mountainsCache) {
    mountainsCache = await fetchJson<Mountain[]>(
      '/api/mountains',
      '/data/mountains_integrated.json',
    );
  }
  return mountainsCache;
}

export async function getMountains(params?: {
  q?: string;
  region?: string;
  risk_level?: string;
  page?: number;
  size?: number;
}): Promise<Mountain[]> {
  if (USE_STATIC) {
    let data = await loadAllMountains();
    if (params?.q) {
      const q = params.q.toLowerCase();
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.location_raw.toLowerCase().includes(q) ||
          (m.base_name?.toLowerCase().includes(q) ?? false),
      );
    }
    if (params?.region) {
      data = data.filter((m) => m.region_city.includes(params.region!));
    }
    if (params?.risk_level) {
      data = data.filter((m) => m.risk_level === params.risk_level!.toUpperCase());
    }
    const page = params?.page ?? 1;
    const size = params?.size ?? 50;
    const start = (page - 1) * size;
    return data.slice(start, start + size);
  }
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.region) search.set('region', params.region);
  if (params?.risk_level) search.set('risk_level', params.risk_level);
  if (params?.page) search.set('page', String(params.page));
  if (params?.size) search.set('size', String(params.size));
  const qs = search.toString();
  return fetchJson(`/api/mountains${qs ? `?${qs}` : ''}`, '/data/mountains_integrated.json');
}

export async function countMountains(params?: {
  q?: string;
  region?: string;
  risk_level?: string;
}): Promise<number> {
  const all = await loadAllMountains();
  let data = all;
  if (params?.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.location_raw.toLowerCase().includes(q),
    );
  }
  if (params?.region) data = data.filter((m) => m.region_city.includes(params.region!));
  if (params?.risk_level) {
    data = data.filter((m) => m.risk_level === params.risk_level!.toUpperCase());
  }
  return data.length;
}

export async function getMountain(code: string): Promise<Mountain | undefined> {
  if (USE_STATIC) {
    const all = await loadAllMountains();
    return all.find((m) => m.mountain_code === code);
  }
  const res = await fetch(`${API_BASE}/api/mountains/${code}`);
  if (!res.ok) return undefined;
  return res.json();
}

export async function getMountainWeather(code: string): Promise<MountainWeather> {
  if (USE_STATIC) {
    const m = await getMountain(code);
    if (!m?.forecast_match) {
      return { available: false, message: '산악예보 지점과 연결되지 않았습니다.', items: [] };
    }
    return {
      available: false,
      forecast_station_name: m.forecast_match.forecast_station_name,
      message: '정적 배포 모드에서는 Render API 연동 후 기후 데이터를 제공합니다.',
      items: [],
    };
  }
  const res = await fetch(`${API_BASE}/api/mountains/${code}/weather`);
  return res.json();
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
    const mountains = await loadAllMountains();
    return mountains.map((m) => ({
      mountain_code: m.mountain_code,
      name: m.name,
      latitude: m.latitude,
      longitude: m.longitude,
      elevation_m: m.elevation_m,
      manager_org: m.manager_org,
      manager_phone: m.manager_phone,
      location_raw: m.location_raw,
      risk_score: m.risk_score,
      risk_level: m.risk_level,
      accident_count: m.stats.accident_count,
    }));
  }
  return fetchJson('/api/risk-map', '/data/mountains_integrated.json');
}

export async function evaluateChecklist(
  answers: Record<string, boolean>,
  mountainCode?: string,
): Promise<ChecklistResult> {
  if (USE_STATIC) {
    return evaluateChecklistLocal(answers, mountainCode);
  }
  const res = await fetch(`${API_BASE}/api/checklist/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, mountain_code: mountainCode ?? null }),
  });
  if (!res.ok) throw new Error('체크리스트 평가 실패');
  return res.json();
}

async function evaluateChecklistLocal(
  answers: Record<string, boolean>,
  mountainCode?: string,
): Promise<ChecklistResult> {
  const items = await getChecklistItems();
  const mountain = mountainCode ? await getMountain(mountainCode) : undefined;
  const maxScore = items.reduce((s, i) => s + i.weight, 0);
  let earned = 0;
  const advice: string[] = [];
  let failedCritical = false;

  for (const item of items) {
    if (answers[String(item.id)]) earned += item.weight;
    else if (item.is_critical) {
      failedCritical = true;
      advice.push(`[필수] ${item.question_ko} — ${item.tip_ko}`);
    }
  }

  const totalScore = maxScore ? Math.round((earned / maxScore) * 100) : 0;
  const prepLevel = failedCritical ? 'HIGH' : totalScore >= 80 ? 'LOW' : totalScore >= 50 ? 'MEDIUM' : 'HIGH';

  if (mountain) {
    advice.unshift(`[${mountain.name}] 위험지수 ${mountain.risk_score}점 (${mountain.risk_level})`);
  }
  if (!advice.length) advice.push('준비가 잘 되어 있습니다. 안전 수칙을 지키며 즐거운 등산 되세요!');

  let combinedLevel = prepLevel;
  if (mountain && mountain.risk_score >= 61 && prepLevel !== 'LOW') combinedLevel = 'HIGH';
  else if (mountain && mountain.risk_score >= 31) combinedLevel = prepLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';

  return {
    total_score: totalScore,
    risk_level: prepLevel,
    advice: advice.slice(0, 8),
    mountain_risk_score: mountain?.risk_score ?? null,
    combined_level: combinedLevel,
  };
}
