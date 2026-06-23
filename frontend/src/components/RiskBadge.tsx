import type { RiskLevel } from '../types';
import { RISK_LABELS } from '../types';

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  VERY_HIGH: 'bg-red-100 text-red-800 border-red-300',
};

const RISK_DOT: Record<RiskLevel, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  VERY_HIGH: 'bg-red-500',
};

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-1.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${RISK_STYLES[level]} ${sizeClass}`}>
      <span className={`h-2 w-2 rounded-full ${RISK_DOT[level]}`} />
      {RISK_LABELS[level]}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}

export function riskColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    VERY_HIGH: '#ef4444',
  };
  return map[level];
}
