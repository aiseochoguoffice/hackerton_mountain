export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface MountainStats {
  accident_count: number;
  type_breakdown: Record<string, number>;
  hour_breakdown: Record<string, number>;
  season_breakdown: Record<string, number>;
  rescued_total: number;
  air_rescue_count: number;
  air_rescue_ratio: number;
}

export interface Mountain {
  id: number;
  name: string;
  region_city: string;
  region_district: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  difficulty: string;
  risk_score: number;
  risk_level: RiskLevel;
  stats: MountainStats;
  aliases?: string[];
  caution_notes?: string;
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
  type_breakdown: Record<string, number>;
  mapped_mountains: number;
  total_mountains?: number;
  unmapped_accident_count?: number;
  match_rate_pct?: number;
  data_source?: string;
  source_breakdown?: Record<string, number>;
  match_methods?: Record<string, number>;
  generated_at: string;
  /** @deprecated 구 schema 호환 */
  status_count?: number;
  rescue_count?: number;
  unmapped_regions?: number;
}

export interface ChecklistResult {
  total_score: number;
  risk_level: string;
  advice: string[];
  mountain_risk_score: number | null;
  combined_level: string;
}

export interface RiskMapPoint {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: RiskLevel;
  accident_count: number;
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
