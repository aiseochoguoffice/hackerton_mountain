import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMountains, getOverview } from '../api/client';
import { TYPE_COLORS, TYPE_LABELS, type Mountain, type Overview } from '../types';

export function StatsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topMountains, setTopMountains] = useState<Mountain[]>([]);

  useEffect(() => {
    Promise.all([getOverview(), getMountains({ size: 5000 })]).then(([ov, mountains]) => {
      setOverview(ov);
      setTopMountains(
        [...mountains]
          .filter((m) => m.stats.accident_count > 0)
          .sort((a, b) => b.stats.accident_count - a.stats.accident_count)
          .slice(0, 10),
      );
    });
  }, []);

  if (!overview) return <p className="py-10 text-center text-slate-500">로딩 중...</p>;

  const typeData = Object.entries(overview.type_breakdown).map(([code, value]) => ({
    name: TYPE_LABELS[code] || code,
    value,
    code,
  }));

  const mountainData = topMountains.map((m) => ({
    name: m.name.length > 8 ? `${m.name.slice(0, 8)}…` : m.name,
    accidents: m.stats.accident_count,
    risk: m.risk_score,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">전국 사고 통계</h1>
        <p className="text-slate-600">
          통합 CSV {overview.total_accidents.toLocaleString()}건 · 매칭률 {overview.match_rate_pct}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: '총 사고', value: overview.total_accidents },
          { label: '등록 산', value: overview.total_mountains },
          { label: '사고 매핑 산', value: overview.mapped_mountains },
          { label: '미매핑 사고', value: overview.unmapped_accident_count },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-emerald-700">
              {item.value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">데이터 출처별 건수</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(overview.source_breakdown).map(([src, cnt]) => (
            <span key={src} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
              {src}: {cnt.toLocaleString()}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">사고 유형별 분포</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={typeData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip formatter={(v: number) => [`${v.toLocaleString()}건`, '사고']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {typeData.map((entry) => (
                <Cell key={entry.code} fill={TYPE_COLORS[entry.code] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">사고 다발 산 Top 10</h2>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={mountainData} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="accidents" fill="#059669" radius={[0, 4, 4, 0]} name="사고 건수" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
