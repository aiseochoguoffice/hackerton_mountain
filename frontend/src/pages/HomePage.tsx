import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAccidentTypes, getMountains, getOverview } from '../api/client';
import { MountainCard } from '../components/MountainCard';
import { fmtNum } from '../utils/format';
import type { AccidentType, Mountain, Overview } from '../types';
import { TYPE_LABELS } from '../types';

export function HomePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topMountains, setTopMountains] = useState<Mountain[]>([]);
  const [types, setTypes] = useState<AccidentType[]>([]);

  useEffect(() => {
    Promise.all([getOverview(), getMountains(), getAccidentTypes()]).then(
      ([ov, mountains, accidentTypes]) => {
        setOverview(ov);
        setTopMountains(
          [...mountains]
            .filter((m) => m.stats.accident_count > 0)
            .sort((a, b) => b.risk_score - a.risk_score)
            .slice(0, 5),
        );
        setTypes(accidentTypes);
      },
    );
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white md:p-10">
        <h1 className="text-2xl font-bold md:text-4xl">산행 전, 데이터로 위험을 확인하세요</h1>
        <p className="mt-3 max-w-2xl text-emerald-50 md:text-lg">
          소방청 전국 산악사고 {fmtNum(overview?.total_accidents)}건 분석 기반
          산별 위험지수·사고 유형·맞춤 체크리스트를 제공합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/mountains"
            className="rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-700 shadow hover:bg-emerald-50"
          >
            산 검색하기
          </Link>
          <Link
            to="/checklist"
            className="rounded-lg border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10"
          >
            체크리스트 시작
          </Link>
        </div>
      </section>

      {overview && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: '전국 사고', value: fmtNum(overview.total_accidents) },
            { label: '분석 산', value: `${overview.mapped_mountains ?? overview.total_mountains ?? 0}개` },
            { label: '매칭률', value: overview.match_rate_pct != null ? `${overview.match_rate_pct}%` : '—' },
            { label: '미매칭 사고', value: fmtNum(overview.unmapped_accident_count) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-white p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-emerald-700">{item.value}</div>
              <div className="text-sm text-slate-500">{item.label}</div>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">위험지수 Top 5</h2>
          <Link to="/mountains" className="text-sm text-emerald-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topMountains.map((m) => (
            <MountainCard key={m.id} mountain={m} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">사고 유형 분포</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((t) => (
            <Link
              key={t.code}
              to="/accident-types"
              className="rounded-xl border bg-white p-4 shadow-sm hover:border-emerald-300"
            >
              <div className="text-2xl">{t.icon_emoji}</div>
              <div className="mt-2 font-semibold">{t.name_ko}</div>
              <div className="text-sm text-slate-500">약 {t.share_pct}%</div>
            </Link>
          ))}
        </div>
      </section>

      {overview && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">전국 사고 유형 (실측)</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(overview.type_breakdown).map(([code, count]) => (
              <span key={code} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {TYPE_LABELS[code] || code}: {fmtNum(count)}건
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
