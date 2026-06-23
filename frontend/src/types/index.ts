export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface MountainStats {
  accident_count: number;
  type_breakdown: Record<string, number>;
  hour_breakdown: Record<string, number>;
  season_breakdown: Record<string, number>;
  year_breakdown: Record<string, number>;
  source_breakdown: Record<string, number>;
  rescued_total: number;
  air_rescue_count: number;
  air_rescue_ratio: number;
}

export interface ForecastMatch {
  mountain_num: string;
  forecast_station_name: string;
  match_method: string;
  match_confidence: string;
}

export interface Mountain {
  mountain_code: string;
  name: string;
  base_name?: string;
  region_city: string;
  region_district: string;
  location_raw: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  manager_org: string;
  manager_phone: string;
  description?: string;
  difficulty: string;
  risk_score: number;
  risk_level: RiskLevel;
  stats: MountainStats;
  caution_notes?: string;
  forecast_match?: ForecastMatch | null;
  geocode_quality?: string;
  risk_updated_at?: string;
}

export interface AccidentType {
  id: number;
  code: string;
  name_ko: string;
  description: string;
  prevention_tips: string;
  emergency_action: string;
  icon_emoji: string;
  share_pct: number;
}

export interface ChecklistItem {
  id: number;
  category: string;
  question_ko: string;
  tip_ko: string;
  weight: number;
  is_critical: boolean;
  sort_order: number;
}

export interface Overview {
  total_accidents: number;
  source_breakdown: Record<string, number>;
  type_breakdown: Record<string, number>;
  mapped_mountains: number;
  total_mountains: number;
  unmapped_accident_count: number;
  match_rate_pct: number;
  generated_at: string;
}

export interface ChecklistResult {
  total_score: number;
  risk_level: string;
  advice: string[];
  mountain_risk_score: number | null;
  combined_level: string;
}

export interface RiskMapPoint {
  mountain_code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  manager_org: string;
  manager_phone: string;
  location_raw: string;
  risk_score: number;
  risk_level: RiskLevel;
  accident_count: number;
}

export interface WeatherItem {
  category: string;
  fcst_date: string;
  fcst_time: string;
  value: string;
}

export interface MountainWeather {
  available: boolean;
  mountain_code?: string;
  forecast_station_name?: string;
  items: WeatherItem[];
  message?: string | null;
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  VERY_HIGH: '매우높음',
};

export const TYPE_LABELS: Record<string, string> = {
  SLIP_FALL: '실족추락',
  ILLNESS: '개인질환',
  LOST: '일반조난',
  OTHER: '기타산악',
};

export const TYPE_COLORS: Record<string, string> = {
  SLIP_FALL: '#ef4444',
  ILLNESS: '#f97316',
  LOST: '#eab308',
  OTHER: '#94a3b8',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: '쉬움',
  MODERATE: '보통',
  HARD: '어려움',
  EXPERT: '전문가',
};

export const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: '장비',
  HEALTH: '건강',
  WEATHER: '날씨',
  COMPANION: '동행',
  ROUTE: '코스',
};

export const WEATHER_CATEGORY_LABELS: Record<string, string> = {
  TMP: '기온(℃)',
  POP: '강수확률(%)',
  WSD: '풍속(m/s)',
  REH: '습도(%)',
  SKY: '하늘상태',
  PTY: '강수형태',
};
