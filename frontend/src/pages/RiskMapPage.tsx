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
  const [listQuery, setListQuery] = useState('');
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

  const listItems = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    let items = [...displayed];
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location_raw.toLowerCase().includes(q),
      );
    }
    return items
      .sort((a, b) => b.risk_score - a.risk_score || b.accident_count - a.accident_count)
      .slice(0, 200);
  }, [displayed, listQuery]);

  const center: [number, number] = [36.5, 127.5];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">전국 위험지수 지도</h1>
          <p className="text-slate-600">
            {displayed.length.toLocaleString()}개 산 · 높이·관리주체·위험지수
          </p>
          <p className="mt-1 text-xs text-amber-700">
            mountains2에 위경도가 없어 소재지(시도) 기준으로 분산 표시됩니다. 실제 위치와 다를 수 있습니다.
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
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="h-[65vh] min-h-[420px] overflow-hidden rounded-xl border shadow-sm">
            <MapContainer center={center} zoom={7} className="h-full w-full" preferCanvas>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={displayed} />
              {displayed.map((p) => (
                <CircleMarker
                  key={p.mountain_code}
                  center={[p.latitude, p.longitude]}
                  radius={Math.min(4 + p.risk_score / 25, 10)}
                  pathOptions={{
                    color: riskColor(p.risk_level),
                    fillColor: riskColor(p.risk_level),
                    fillOpacity: p.accident_count > 0 ? 0.8 : 0.45,
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

          <aside className="flex max-h-[65vh] min-h-[320px] flex-col rounded-xl border bg-white shadow-sm">
            <div className="border-b p-3">
              <h2 className="font-bold">산 목록</h2>
              <input
                type="search"
                placeholder="이름·소재지 검색"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                {listQuery
                  ? `검색 ${listItems.length}건 (최대 200)`
                  : `위험지수 순 상위 ${listItems.length}건`}
              </p>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y">
              {listItems.map((p) => (
                <li key={p.mountain_code}>
                  <Link
                    to={`/mountains/${p.mountain_code}`}
                    className="flex items-start gap-2 px-3 py-2.5 hover:bg-slate-50"
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: riskColor(p.risk_level) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-slate-500">{p.location_raw}</span>
                      <span className="text-xs text-slate-600">
                        위험 {p.risk_score} · 사고 {p.accident_count}건
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {!listItems.length && (
                <li className="px-3 py-8 text-center text-sm text-slate-500">검색 결과 없음</li>
              )}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
