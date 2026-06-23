import L from 'leaflet';
import type { RiskLevel } from '../types';
import { riskColor } from '../components/RiskBadge';

function markerSize(riskScore: number): number {
  return Math.min(44, Math.max(28, 24 + riskScore / 12));
}

function mountainSvg(color: string, size: number): string {
  const h = size;
  const w = size;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 36" width="${w}" height="${h}" aria-hidden="true">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M16 3 L29 28 L3 28 Z" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 3 L21.5 15 L10.5 15 Z" fill="#ffffff" fill-opacity="0.35"/>
        <ellipse cx="16" cy="29" rx="9" ry="2" fill="#000000" fill-opacity="0.12"/>
      </g>
    </svg>
  `;
}

export function createMountainIcon(level: RiskLevel, riskScore: number): L.DivIcon {
  const size = markerSize(riskScore);
  const color = riskColor(level);

  return L.divIcon({
    className: 'mountain-marker-icon',
    html: mountainSvg(color, size),
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 4],
  });
}
