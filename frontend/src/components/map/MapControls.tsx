import { useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';

export type MapLayerType = 'street' | 'satellite';

interface MapControlsProps {
  layer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
}

export function MapControls({ layer, onLayerChange }: MapControlsProps) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('브라우저가 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 13, { duration: 1.2 });
        setLocating(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '위치 권한이 거부되었습니다.',
          2: '위치를 확인할 수 없습니다.',
          3: '위치 요청 시간이 초과되었습니다.',
        };
        setLocateError(messages[err.code] ?? '위치를 가져오지 못했습니다.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map]);

  return (
    <div className="leaflet-top leaflet-right pointer-events-none !mt-3 !mr-3 space-y-2">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div
          className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
          role="group"
          aria-label="지도 유형 선택"
        >
          <button
            type="button"
            onClick={() => onLayerChange('street')}
            className={`px-3 py-2 text-xs font-semibold transition ${
              layer === 'street'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            aria-pressed={layer === 'street'}
          >
            일반
          </button>
          <button
            type="button"
            onClick={() => onLayerChange('satellite')}
            className={`border-l border-slate-200 px-3 py-2 text-xs font-semibold transition ${
              layer === 'satellite'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            aria-pressed={layer === 'satellite'}
          >
            위성
          </button>
        </div>

        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 disabled:opacity-60"
          aria-label="내 위치로 이동"
        >
          <LocateIcon spinning={locating} />
          {locating ? '확인 중…' : '내 위치'}
        </button>

        {locateError && (
          <p className="max-w-[180px] rounded-lg bg-red-50 px-2 py-1 text-right text-[11px] text-red-600 shadow-sm">
            {locateError}
          </p>
        )}
      </div>
    </div>
  );
}

function LocateIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {spinning ? (
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      ) : (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          <path d="M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M5.64 18.36l1.42-1.42M16.94 7.06l1.42-1.42" />
        </>
      )}
    </svg>
  );
}
