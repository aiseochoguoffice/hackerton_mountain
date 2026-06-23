import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMountain } from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import type { ChecklistResult, Mountain, RiskLevel } from '../types';
import { RISK_LABELS } from '../types';

export function ChecklistResultPage() {
  const [result, setResult] = useState<ChecklistResult | null>(null);
  const [mountain, setMountain] = useState<Mountain | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('checklist_result');
    const mid = sessionStorage.getItem('checklist_mountain_id');
    if (raw) setResult(JSON.parse(raw));
    if (mid) getMountain(Number(mid)).then((m) => setMountain(m ?? null));
  }, []);

  if (!result) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">체크리스트 결과가 없습니다.</p>
        <Link to="/checklist" className="mt-4 inline-block text-emerald-600 hover:underline">
          체크리스트 시작
        </Link>
      </div>
    );
  }

  const combinedLevel = (result.combined_level as RiskLevel) || 'MEDIUM';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">체크 결과</h1>

      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
        <div className="text-5xl font-bold text-emerald-700">{result.total_score}</div>
        <div className="text-slate-500">준비도 점수 / 100</div>
        <div className="mt-4 flex justify-center gap-3">
          <RiskBadge level={combinedLevel} size="lg" />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          종합 판정: <strong>{RISK_LABELS[combinedLevel]}</strong>
          {mountain && ` (${mountain.name} 위험지수 ${mountain.risk_score} 반영)`}
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">맞춤 경고 & 조언</h2>
        <ul className="mt-3 space-y-2">
          {result.advice.map((a, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="text-amber-500">•</span>
              {a}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/checklist"
          className="flex-1 rounded-xl border py-3 text-center font-medium hover:bg-slate-50"
        >
          다시 체크
        </Link>
        {mountain && (
          <Link
            to={`/mountains/${mountain.id}`}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-center font-medium text-white hover:bg-emerald-700"
          >
            {mountain.name} 상세 보기
          </Link>
        )}
      </div>
    </div>
  );
}
