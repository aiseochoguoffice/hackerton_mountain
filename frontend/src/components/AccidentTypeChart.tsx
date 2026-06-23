import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TYPE_COLORS, TYPE_LABELS } from '../types';

interface Props {
  data: Record<string, number>;
}

export function AccidentTypeChart({ data }: Props) {
  const chartData = Object.entries(data).map(([code, value]) => ({
    name: TYPE_LABELS[code] || code,
    value,
    code,
  }));

  if (!chartData.length) {
    return <p className="text-sm text-slate-500">사고 데이터 없음</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.code} fill={TYPE_COLORS[entry.code] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [`${v}건`, '사고']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarProps {
  data: Record<string, number>;
  label?: string;
}

export function BreakdownBarChart({ data, label }: BarProps) {
  const sorted = Object.entries(data)
    .sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]))
    .map(([k, v]) => ({ name: k, value: v }));

  if (!sorted.length) return null;

  const max = Math.max(...sorted.map((d) => d.value));

  return (
    <div className="space-y-2">
      {label && <h4 className="text-sm font-medium text-slate-600">{label}</h4>}
      <div className="space-y-1.5">
        {sorted.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="w-12 shrink-0 text-slate-500">{item.name}</span>
            <div className="h-5 flex-1 rounded bg-slate-100">
              <div
                className="h-full rounded bg-emerald-500 transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-slate-600">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
