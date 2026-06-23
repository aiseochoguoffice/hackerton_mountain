import { useEffect, useState } from 'react';
import { countMountains, getMountains } from '../api/client';
import { MountainCard } from '../components/MountainCard';
import { RISK_LABELS, type Mountain, type RiskLevel } from '../types';

const PAGE_SIZE = 48;

export function MountainsPage() {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {
      q: query || undefined,
      region: region || undefined,
      risk_level: riskLevel || undefined,
      page,
      size: PAGE_SIZE,
    };
    Promise.all([getMountains(params), countMountains(params)]).then(([data, cnt]) => {
      setMountains(data);
      setTotal(cnt);
      setLoading(false);
    });
  }, [query, region, riskLevel, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const regions = [
    '서울특별시', '경기도', '강원특별자치도', '충청북도', '충청남도',
    '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
    '부산광역시', '대구광역시', '광주광역시',
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">전국 산 목록</h1>
        <p className="text-slate-600">총 {total.toLocaleString()}개 · mountains2 기반</p>
      </div>

      <div className="sticky top-16 z-10 space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="산 이름·소재지 검색 (동명이산은 소재지로 구분)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">전체 지역</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={riskLevel}
            onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
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
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mountains.map((m) => (
              <MountainCard key={m.mountain_code} mountain={m} />
            ))}
            {!mountains.length && (
              <p className="col-span-full py-10 text-center text-slate-500">검색 결과가 없습니다.</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
