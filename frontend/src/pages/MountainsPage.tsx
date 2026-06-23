import { useEffect, useState } from 'react';
import { getMountains } from '../api/client';
import { MountainCard } from '../components/MountainCard';
import { RISK_LABELS, type Mountain, type RiskLevel } from '../types';

export function MountainsPage() {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMountains({ q: query || undefined, region: region || undefined, risk_level: riskLevel || undefined })
      .then(setMountains)
      .finally(() => setLoading(false));
  }, [query, region, riskLevel]);

  const regions = [...new Set(mountains.map((m) => m.region_city))].sort();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">전국 산 목록</h1>
      <p className="text-slate-600">소방청 산악사고 데이터 기반 위험지수·사고 통계</p>

      <div className="sticky top-16 z-10 space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="산 이름 검색 (예: 북한산, 지리산)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">전체 지역</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">전체 등급</option>
            {(Object.keys(RISK_LABELS) as RiskLevel[]).map((level) => (
              <option key={level} value={level}>{RISK_LABELS[level]}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">로딩 중...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mountains.map((m) => (
            <MountainCard key={m.id} mountain={m} />
          ))}
          {!mountains.length && (
            <p className="col-span-full py-10 text-center text-slate-500">검색 결과가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
