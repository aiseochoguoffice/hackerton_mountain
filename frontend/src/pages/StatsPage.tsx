import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMountains, getOverview } from '../api/client';
import { TYPE_COLORS, TYPE_LABELS, type Mountain, type Overview } from '../types';

export function StatsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topMountains, setTopMountains] = useState<Mountain[]>([]);

  useEffect(() => {
    Promise.all([getOverview(), getMountains()]).then(([ov, mountains]) => {
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
    name: m.name,
    accidents: m.stats.accident_count,
    risk: m.risk_score,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">전국 사고 통계</h1>
        <p className="text-slate-600">
          소방청 데이터 {overview.generated_at.slice(0, 10)} 기준
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: '총 사고', value: overview.total_accidents },
          { label: '2024 현황', value: overview.status_count },
          { label: '2020 구조활동', value: overview.rescue_count },
          { label: '분석 산', value: overview.mapped_mountains },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-emerald-700">{item.value.toLocaleString()}</div>
            <div className="text-sm text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

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
