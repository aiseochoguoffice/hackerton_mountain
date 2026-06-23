import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getRiskMap } from '../api/client';
import { riskColor } from '../components/RiskBadge';
import type { RiskMapPoint } from '../types';
import { RISK_LABELS } from '../types';

function FitBounds({ points }: { points: RiskMapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const lats = points.map((p) => p.latitude);
      const lngs = points.map((p) => p.longitude);
      map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ]);
    }
  }, [map, points]);
  return null;
}

export function RiskMapPage() {
  const [points, setPoints] = useState<RiskMapPoint[]>([]);
  const [filterAccidents, setFilterAccidents] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiskMap().then((data) => {
      setPoints(data);
      setLoading(false);
    });
  }, []);

  const displayed = useMemo(
    () => (filterAccidents ? points.filter((p) => p.accident_count > 0) : points),
    [points, filterAccidents],
  );

  const center: [number, number] = [36.5, 127.5];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">전국 위험지수 지도</h1>
          <p className="text-slate-600">
            {displayed.length.toLocaleString()}개 산 · 높이·관리주체·위험지수
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filterAccidents}
            onChange={(e) => setFilterAccidents(e.target.checked)}
          />
          사고 이력 있는 산만 ({points.filter((p) => p.accident_count > 0).length.toLocaleString()}개)
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(RISK_LABELS) as Array<keyof typeof RISK_LABELS>).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: riskColor(level) }} />
            {RISK_LABELS[level]}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-slate-500">지도 로딩 중...</p>
      ) : (
        <div className="h-[65vh] min-h-[420px] overflow-hidden rounded-xl border shadow-sm">
          <MapContainer center={center} zoom={7} className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={displayed.slice(0, 500)} />
            {displayed.map((p) => (
              <CircleMarker
                key={p.mountain_code}
                center={[p.latitude, p.longitude]}
                radius={Math.min(6 + p.risk_score / 20, 14)}
                pathOptions={{
                  color: riskColor(p.risk_level),
                  fillColor: riskColor(p.risk_level),
                  fillOpacity: p.accident_count > 0 ? 0.75 : 0.35,
                  weight: 1,
                }}
              >
                <Popup maxWidth={280}>
                  <strong>{p.name}</strong>
                  <br />
                  {p.location_raw}
                  <br />
                  고도: {p.elevation_m > 0 ? `${p.elevation_m}m` : '미등록'}
                  <br />
                  관리: {p.manager_org || '-'}
                  {p.manager_phone && (
                    <>
                      <br />
                      <a href={`tel:${p.manager_phone}`}>{p.manager_phone}</a>
                    </>
                  )}
                  <br />
                  위험지수: {p.risk_score} ({RISK_LABELS[p.risk_level]})
                  <br />
                  사고: {p.accident_count}건
                  <br />
                  <Link to={`/mountains/${p.mountain_code}`} className="text-emerald-600">
                    상세 보기
                  </Link>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
      {displayed.length > 2000 && (
        <p className="text-xs text-slate-500">
          마커 {displayed.length.toLocaleString()}개 — 성능을 위해 줌/필터를 활용하세요.
        </p>
      )}
    </div>
  );
}
