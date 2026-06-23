import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evaluateChecklist, getChecklistItems, getMountains } from '../api/client';
import { CATEGORY_LABELS, type ChecklistItem, type Mountain } from '../types';

export function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0);
  const [mountainCode, setMountainCode] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('mountain');
    if (code) setMountainCode(code);
    Promise.all([
      getChecklistItems(),
      getMountains({ size: 200 }),
    ]).then(([checkItems, mts]) => {
      setItems(checkItems);
      setMountains(mts.filter((m) => m.stats.accident_count > 0));
    });
  }, [searchParams]);

  const current = items[step];

  const toggle = (id: number, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [String(id)]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await evaluateChecklist(answers, mountainCode);
      sessionStorage.setItem('checklist_result', JSON.stringify(result));
      sessionStorage.setItem('checklist_mountain_code', mountainCode ?? '');
      navigate('/checklist/result');
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return <p className="py-10 text-center text-slate-500">체크리스트 로딩 중...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">산행 전 체크리스트</h1>
        <p className="text-slate-600">12문항 · {step + 1}/{items.length}</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-600">등산할 산 (선택)</label>
        <select
          value={mountainCode ?? ''}
          onChange={(e) => setMountainCode(e.target.value || undefined)}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {mountains.map((m) => (
            <option key={m.mountain_code} value={m.mountain_code}>
              {m.name} ({m.location_raw}) · 위험 {m.risk_score}
            </option>
          ))}
        </select>
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${((step + 1) / items.length) * 100}%` }}
        />
      </div>

      {current && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {CATEGORY_LABELS[current.category]}
            {current.is_critical && ' · 필수'}
          </span>
          <h2 className="mt-3 text-xl font-bold">{current.question_ko}</h2>
          <p className="mt-2 text-sm text-slate-500">{current.tip_ko}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { toggle(current.id, true); if (step < items.length - 1) setStep(step + 1); }}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              예 ✓
            </button>
            <button
              onClick={() => { toggle(current.id, false); if (step < items.length - 1) setStep(step + 1); }}
              className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              아니오 ✗
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="rounded-lg px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
        >
          이전
        </button>
        {step === items.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? '평가 중...' : '결과 보기'}
          </button>
        ) : (
          <button onClick={() => setStep(step + 1)} className="rounded-lg px-4 py-2 text-sm text-emerald-600">
            다음
          </button>
        )}
      </div>
    </div>
  );
}
