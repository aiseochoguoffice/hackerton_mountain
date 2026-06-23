import { Link } from 'react-router-dom';
import { RiskBadge } from '../RiskBadge';
import type { RiskMapPoint } from '../../types';
import { RISK_LABELS } from '../../types';

interface MountainMapPopupProps {
  point: RiskMapPoint;
}

export function MountainMapPopup({ point }: MountainMapPopupProps) {
  return (
    <div className="w-[240px] overflow-hidden sm:w-[260px]">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 py-3 text-white">
        <div className="flex items-start gap-2">
          <span className="text-2xl leading-none" aria-hidden="true">
            🏔️
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold">{point.name}</h3>
            <p className="mt-0.5 text-xs text-emerald-100">산악사고 위험 분석</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">위험 등급</span>
          <RiskBadge level={point.risk_level} score={point.risk_score} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
            <div className="text-lg font-bold text-slate-800">{point.risk_score}</div>
            <div className="text-[11px] text-slate-500">위험지수</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
            <div className="text-lg font-bold text-slate-800">{point.accident_count}</div>
            <div className="text-[11px] text-slate-500">구조활동(건)</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          {RISK_LABELS[point.risk_level]} 등급 · 데이터 기반 추정
        </p>

        <Link
          to={`/mountains/${point.id}`}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          상세 정보 보기
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
