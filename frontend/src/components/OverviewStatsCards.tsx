import { fmtNum } from '../utils/format';
import { getAverageRiskScore, getMappedCount, getRescueCount } from '../utils/overview';
import type { Mountain, Overview } from '../types';

interface OverviewStatsCardsProps {
  overview: Overview;
  mountains: Mountain[];
}

export function OverviewStatsCards({ overview, mountains }: OverviewStatsCardsProps) {
  const avgRiskScore = getAverageRiskScore(mountains);

  const items = [
    { label: '사고 발생 건수', value: fmtNum(getRescueCount(overview)) },
    { label: '산악사고 발생 산', value: `${getMappedCount(overview)}개` },
    { label: '평균 위험지수', value: avgRiskScore != null ? `${avgRiskScore}점` : '—' },
    { source: true as const, value: '출처 : 소방청', subValue: '(공공데이터 포털)' },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label ?? item.value} className="rounded-xl border bg-white p-4 text-center shadow-sm">
          {'source' in item && item.source ? (
            <>
              <div className="text-2xl font-bold text-emerald-700">{item.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{item.subValue}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-emerald-700">{item.value}</div>
              <div className="text-sm text-slate-500">{item.label}</div>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
