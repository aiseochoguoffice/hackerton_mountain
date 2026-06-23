import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { getRiskMap } from '../api/client';
import { riskColor } from '../components/RiskBadge';
import { MapControls, type MapLayerType } from '../components/map/MapControls';
import { MountainMapPopup } from '../components/map/MountainMapPopup';
import { createMountainIcon } from '../utils/mountainMarkerIcon';
import type { RiskMapPoint } from '../types';
import { RISK_LABELS } from '../types';

const TILE_LAYERS: Record<MapLayerType, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
};

export function RiskMapPage() {
  const [points, setPoints] = useState<RiskMapPoint[]>([]);
  const [layer, setLayer] = useState<MapLayerType>('street');

  useEffect(() => {
    getRiskMap().then(setPoints);
  }, []);

  const center: [number, number] = [36.5, 127.5];
  const tile = TILE_LAYERS[layer];

  const markers = useMemo(
    () =>
      points.map((p) => ({
        point: p,
        icon: createMountainIcon(p.risk_level, p.risk_score),
      })),
    [points],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">전국 위험지수 지도</h1>
        <p className="text-slate-600">산별 사고 데이터 기반 위험 등급 시각화</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {(Object.keys(RISK_LABELS) as Array<keyof typeof RISK_LABELS>).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span
              className="inline-flex h-4 w-4 items-end justify-center"
              dangerouslySetInnerHTML={{
                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 36" width="14" height="16"><path d="M16 3 L29 28 L3 28 Z" fill="${riskColor(level)}" stroke="#fff" stroke-width="1.5"/></svg>`,
              }}
            />
            {RISK_LABELS[level]}
          </span>
        ))}
      </div>

      <div className="relative h-[60vh] min-h-[400px] overflow-hidden rounded-xl border shadow-sm">
        <MapContainer center={center} zoom={7} className="h-full w-full">
          <TileLayer attribution={tile.attribution} url={tile.url} />
          {markers.map(({ point, icon }) => (
            <Marker key={point.id} position={[point.latitude, point.longitude]} icon={icon}>
              <Popup className="mountain-popup" closeButton>
                <MountainMapPopup point={point} />
              </Popup>
            </Marker>
          ))}
          <MapControls layer={layer} onLayerChange={setLayer} />
        </MapContainer>
      </div>
    </div>
  );
}
