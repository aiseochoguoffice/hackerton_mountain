import { useEffect, useState } from 'react';
import { getAccidentTypes } from '../api/client';
import type { AccidentType } from '../types';

export function AccidentTypesPage() {
  const [types, setTypes] = useState<AccidentType[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getAccidentTypes().then(setTypes);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사고 유형 가이드</h1>
        <p className="text-slate-600">4대 산악사고 유형별 예방법·응급 조치</p>
      </div>

      <div className="space-y-3">
        {types.map((t) => (
          <div key={t.code} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <button
              onClick={() => setOpen(open === t.code ? null : t.code)}
              className="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50"
            >
              <span className="text-3xl">{t.icon_emoji}</span>
              <div className="flex-1">
                <div className="font-bold">{t.name_ko}</div>
                <div className="text-sm text-slate-500">전체 약 {t.share_pct}% · {t.description.slice(0, 40)}...</div>
              </div>
              <span className="text-slate-400">{open === t.code ? '▲' : '▼'}</span>
            </button>
            {open === t.code && (
              <div className="border-t px-5 pb-5 pt-3">
                <p className="text-slate-700">{t.description}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-green-50 p-4">
                    <h3 className="font-bold text-green-900">예방 행동요령</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-green-800">
                      {t.prevention_tips.split('|').map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <h3 className="font-bold text-red-900">응급 조치</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800">
                      {t.emergency_action.split('|').map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
