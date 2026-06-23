/** 숫자 포맷 (undefined/null 안전) */
export function fmtNum(value: number | undefined | null, fallback = '—'): string {
  if (value == null || Number.isNaN(value)) return fallback;
  return value.toLocaleString();
}
