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
