import type { Overview } from '../types';
import { fmtNum } from './format';

/** overview 스키마 호환 헬퍼 */
export function getRescueCount(overview: Partial<Overview>): number | undefined {
  return overview.rescue_count ?? overview.total_accidents;
}

export function getUnmappedLabel(overview: Partial<Overview>): string {
  if (overview.unmapped_regions != null) {
    return `${overview.unmapped_regions}개`;
  }
  if (overview.unmapped_accident_count != null) {
    return fmtNum(overview.unmapped_accident_count);
  }
  return '—';
}

export function getMappedCount(overview: Partial<Overview>): number {
  return overview.mapped_mountains ?? overview.total_mountains ?? 0;
}

/** 사고가 있는 산들의 위험지수 평균 */
export function getAverageRiskScore(mountains: { risk_score: number; stats: { accident_count: number } }[]): number | null {
  const active = mountains.filter((m) => m.stats.accident_count > 0);
  if (active.length === 0) return null;
  const sum = active.reduce((acc, m) => acc + m.risk_score, 0);
  return Math.round((sum / active.length) * 10) / 10;
}
