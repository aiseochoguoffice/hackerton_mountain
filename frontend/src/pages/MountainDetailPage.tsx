import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAccidentTypes, getMountain, getMountainWeather } from '../api/client';
import { AccidentTypeChart, BreakdownBarChart } from '../components/AccidentTypeChart';
import { RiskBadge } from '../components/RiskBadge';
import { RiskGauge } from '../components/RiskGauge';
import type { AccidentType, Mountain, MountainWeather } from '../types';
import { DIFFICULTY_LABELS, TYPE_LABELS, WEATHER_CATEGORY_LABELS } from '../types';

export function MountainDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [mountain, setMountain] = useState<Mountain | null>(null);
  const [types, setTypes] = useState<AccidentType[]>([]);
  const [weather, setWeather] = useState<MountainWeather | null>(null);
  const [tab, setTab] = useState<'overview' | 'stats' | 'guide' | 'weather'>('overview');

  useEffect(() => {
    if (!code) return;
    Promise.all([
      getMountain(code),
      getAccidentTypes(),
      getMountainWeather(code),
    ]).then(([m, t, w]) => {
      setMountain(m ?? null);
      setTypes(t);
      setWeather(w);
    });
  }, [code]);

  if (!mountain) {
    return <div className="py-20 text-center text-slate-500">산 정보를 불러오는 중...</div>;
  }

  const topType = Object.entries(mountain.stats.type_breakdown).sort((a, b) => b[1] - a[1])[0];
  const topTypeInfo = types.find((t) => t.code === topType?.[0]);

  const tabs = [
    { key: 'overview' as const, label: '개요' },
    { key: 'stats' as const, label: '통계' },
    { key: 'guide' as const, label: '행동요령' },
    { key: 'weather' as const, label: '기후' },
  ];

  return (
    <div className="space-y-6">
      <Link to="/mountains" className="text-sm text-emerald-600 hover:underline">← 목록으로</Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">{mountain.name}</h1>
            <p className="mt-1 text-slate-500">{mountain.location_raw}</p>
            <p className="text-xs text-slate-400">산코드 {mountain.mountain_code}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RiskBadge level={mountain.risk_level} score={mountain.risk_score} size="lg" />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {mountain.elevation_m > 0 ? `${mountain.elevation_m}m` : '고도 미등록'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {DIFFICULTY_LABELS[mountain.difficulty]}
              </span>
            </div>
          </div>
          <RiskGauge score={mountain.risk_score} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900">유의사항</h2>
            <p className="mt-2 text-amber-800">{mountain.caution_notes}</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox label="총 사고" value={String(mountain.stats.accident_count)} />
            <InfoBox label="구조 인원" value={String(mountain.stats.rescued_total)} />
            <InfoBox label="관리주체" value={mountain.manager_org || '-'} />
            <InfoBox
              label="관리자 연락처"
              value={mountain.manager_phone || '-'}
              href={mountain.manager_phone ? `tel:${mountain.manager_phone}` : undefined}
            />
          </div>
          {mountain.description && (
            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="font-bold">산 정보</h3>
              <p className="mt-2 text-sm text-slate-700">{mountain.description}</p>
            </section>
          )}
          <Link
            to={`/checklist?mountain=${mountain.mountain_code}`}
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
            <BreakdownBarChart data={mountain.stats.year_breakdown} label="연도별 사고" />
          </section>
        </div>
      )}

      {tab === 'guide' && topTypeInfo && topType && (
        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">
              {topTypeInfo.icon_emoji} 주요 사고: {TYPE_LABELS[topType[0]]} ({topType[1]}건)
            </h2>
            <p className="mt-2 text-slate-600">{topTypeInfo.description}</p>
          </section>
          <GuideBlock title="예방 행동요령" tips={topTypeInfo.prevention_tips} variant="green" />
          <GuideBlock title="응급 조치" tips={topTypeInfo.emergency_action} variant="red" />
        </div>
      )}

      {tab === 'weather' && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">산악 기후 예보</h2>
          {mountain.forecast_match && (
            <p className="mt-1 text-sm text-slate-500">
              예보 지점: {mountain.forecast_match.forecast_station_name}
              ({mountain.forecast_match.match_method})
            </p>
          )}
          {!weather?.available ? (
            <p className="mt-4 text-amber-700">{weather?.message || '기후 데이터 없음'}</p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {weather.items.map((item, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-medium">
                    {WEATHER_CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <span className="ml-2">{item.value}</span>
                  <span className="ml-2 text-slate-400">{item.fcst_date} {item.fcst_time}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function InfoBox({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      {href ? (
        <a href={href} className="mt-1 block font-semibold text-emerald-700">{value}</a>
      ) : (
        <div className="mt-1 font-semibold">{value}</div>
      )}
    </div>
  );
}

function GuideBlock({
  title, tips, variant,
}: { title: string; tips: string; variant: 'green' | 'red' }) {
  const cls = variant === 'green'
    ? 'border-green-200 bg-green-50 text-green-900'
    : 'border-red-200 bg-red-50 text-red-900';
  return (
    <section className={`rounded-xl border p-5 ${cls}`}>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
        {tips.split('|').map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}
