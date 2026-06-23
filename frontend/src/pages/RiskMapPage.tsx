import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getRiskMap } from '../api/client';
import { riskColor } from '../components/RiskBadge';
import type { RiskMapPoint } from '../types';
import { RISK_LABELS } from '../types';

export function RiskMapPage() {
  const [points, setPoints] = useState<RiskMapPoint[]>([]);

  useEffect(() => {
    getRiskMap().then(setPoints);
  }, []);

  const center: [number, number] = [36.5, 127.5];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">전국 위험지수 지도</h1>
        <p className="text-slate-600">산별 사고 데이터 기반 위험 등급 시각화</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(RISK_LABELS) as Array<keyof typeof RISK_LABELS>).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: riskColor(level) }} />
            {RISK_LABELS[level]}
          </span>
        ))}
      </div>

      <div className="h-[60vh] min-h-[400px] overflow-hidden rounded-xl border shadow-sm">
        <MapContainer center={center} zoom={7} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={8 + p.risk_score / 15}
              pathOptions={{
                color: riskColor(p.risk_level),
                fillColor: riskColor(p.risk_level),
                fillOpacity: 0.7,
              }}
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                위험지수: {p.risk_score} ({RISK_LABELS[p.risk_level]})
                <br />
                사고: {p.accident_count}건
                <br />
                <Link to={`/mountains/${p.id}`} className="text-emerald-600">상세 보기</Link>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
