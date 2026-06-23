import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAccidentTypes, getMountain } from '../api/client';
import { AccidentTypeChart, BreakdownBarChart } from '../components/AccidentTypeChart';
import { RiskBadge } from '../components/RiskBadge';
import { RiskGauge } from '../components/RiskGauge';
import type { AccidentType, Mountain } from '../types';
import { DIFFICULTY_LABELS, TYPE_LABELS } from '../types';

export function MountainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mountain, setMountain] = useState<Mountain | null>(null);
  const [types, setTypes] = useState<AccidentType[]>([]);
  const [tab, setTab] = useState<'overview' | 'stats' | 'guide'>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([getMountain(id), getAccidentTypes()]).then(([m, t]) => {
      setMountain(m ?? null);
      setTypes(t);
    });
  }, [id]);

  if (!mountain) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">산 정보를 불러오는 중...</p>
      </div>
    );
  }

  const topType = Object.entries(mountain.stats.type_breakdown).sort((a, b) => b[1] - a[1])[0];
  const topTypeInfo = types.find((t) => t.code === topType?.[0]);

  const tabs = [
    { key: 'overview' as const, label: '개요' },
    { key: 'stats' as const, label: '통계' },
    { key: 'guide' as const, label: '행동요령' },
  ];

  return (
    <div className="space-y-6">
      <Link to="/mountains" className="text-sm text-emerald-600 hover:underline">← 목록으로</Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{mountain.name}</h1>
            <p className="mt-1 text-slate-500">
              {mountain.region_city} {mountain.region_district} · 고도 {mountain.elevation_m}m ·{' '}
              {DIFFICULTY_LABELS[mountain.difficulty]}
            </p>
            <div className="mt-3">
              <RiskBadge level={mountain.risk_level} score={mountain.risk_score} size="lg" />
            </div>
          </div>
          <RiskGauge score={mountain.risk_score} />
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <section className="rounded-xl border bg-amber-50 border-amber-200 p-5">
            <h2 className="font-bold text-amber-900">⚠️ 유의사항</h2>
            <p className="mt-2 text-amber-800">{mountain.caution_notes}</p>
          </section>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">{mountain.stats.accident_count}</div>
              <div className="text-sm text-slate-500">총 사고 건수</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">{mountain.stats.rescued_total}</div>
              <div className="text-sm text-slate-500">구조 인원</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">
                {(mountain.stats.air_rescue_ratio * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-500">항공 이송 비율</div>
            </div>
          </div>
          <Link
            to={`/checklist?mountain=${mountain.id}`}
            className="block rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
          >
            이 산으로 체크리스트 시작
          </Link>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-bold">사고 유형 분포</h3>
            <AccidentTypeChart data={mountain.stats.type_breakdown} />
          </section>
          <section className="space-y-6 rounded-xl border bg-white p-5 shadow-sm">
            <BreakdownBarChart data={mountain.stats.hour_breakdown} label="시간대별 사고 (시)" />
            <BreakdownBarChart data={mountain.stats.season_breakdown} label="계절별 사고" />
          </section>
        </div>
      )}

      {tab === 'guide' && topTypeInfo && (
        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">
              {topTypeInfo.icon_emoji} 주요 사고: {TYPE_LABELS[topType[0]]} ({topType[1]}건)
            </h2>
            <p className="mt-2 text-slate-600">{topTypeInfo.description}</p>
          </section>
          <section className="rounded-xl border border-green-200 bg-green-50 p-5">
            <h3 className="font-bold text-green-900">예방 행동요령</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-green-800">
              {topTypeInfo.prevention_tips.split('|').map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h3 className="font-bold text-red-900">응급 조치</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-red-800">
              {topTypeInfo.emergency_action.split('|').map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
