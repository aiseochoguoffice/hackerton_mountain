import { Link } from 'react-router-dom';
import type { Mountain } from '../types';
import { DIFFICULTY_LABELS } from '../types';
import { RiskBadge } from './RiskBadge';

interface Props {
  mountain: Mountain;
}

export function MountainCard({ mountain }: Props) {
  return (
    <Link
      to={`/mountains/${mountain.mountain_code}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900">{mountain.name}</h3>
          <p className="truncate text-sm text-slate-500">{mountain.location_raw}</p>
        </div>
        <RiskBadge level={mountain.risk_level} score={mountain.risk_score} size="sm" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
          {mountain.elevation_m > 0 ? `${mountain.elevation_m}m` : '고도 미등록'}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
          {DIFFICULTY_LABELS[mountain.difficulty] || mountain.difficulty}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
          사고 {mountain.stats.accident_count}건
        </span>
        {mountain.manager_org && (
          <span className="truncate rounded bg-slate-100 px-2 py-1 text-slate-600">
            {mountain.manager_org}
          </span>
        )}
      </div>
    </Link>
  );
}
