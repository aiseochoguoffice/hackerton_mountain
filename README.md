# 산행 안전 지도 — 소방청 산악사고 데이터 기반 웹 서비스

등산객에게 **전국 4,705개 산별 위험지수**, **사고 유형 통계**, **유의사항·행동요령**, **산행 전 체크리스트**, **산악예보 연동(선택)** 을 제공하는 반응형 웹 서비스입니다.

## 데이터 소스

| 파일 | 설명 |
|------|------|
| `data/mountains2.tsv` | 산림청 산 정보 4,705개 (PK: `mountain_code` 9자리) |
| `data/전국_산악사고_통합.csv` | 전국 산악사고 112,737건 (단일 사고 소스) |
| `json/mountain_forecast_stations.json` | 기상청 산악예보 지점 목록 (PDF 부록 기준) |

사고 데이터는 **산명·소재지 매칭**으로 `mountain_code`에 연결합니다 (매칭률 ~95%).

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| Backend | FastAPI + Uvicorn |
| 데이터 | JSON (집계) + Python ETL v2 |
| 배포 | Vercel (Frontend) + Render (Backend, 선택) |

## 프로젝트 구조

```
hackerton/
├── frontend/          # React SPA (Vercel 배포)
├── backend/           # FastAPI REST API
├── scripts/           # ETL v2, 예보 지점 매핑
├── json/              # 집계 데이터 (ETL 산출)
└── data/              # 원본 TSV/CSV (Git 제외)
```

## 로컬 실행

### 1. ETL (통합 CSV + mountains2 → JSON)

```powershell
# (선택) 산악예보 지점 매핑 — mountain_forecast_stations.json 필요
py scripts/build_forecast_map.py

py scripts/etl_v2.py
```

산출물: `json/mountains_integrated.json`, `json/overview.json` 등 → `frontend/public/data/` 자동 복사

### 2. Backend (선택 — API·산악예보)

`.env` 파일 생성 (`.env.example` 참고):

```powershell
py -m pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/docs

> Vercel 정적 배포 시 `VITE_API_BASE_URL` 미설정이면 `frontend/public/data/*.json` 사용 (산악예보 제외).

## Render 배포 (Backend API · 산악예보)

저장소 루트 `render.yaml` Blueprint를 사용합니다.

### 방법 A — Blueprint (권장)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. GitHub `hackerton_mountain` 저장소 연결
3. `render.yaml` 자동 인식 → **Apply**
4. **Environment**에서 `MOUNTAIN_FORECAST_API_KEY` 값 입력 (기상청 API허브 키)
5. 배포 완료 후 URL 확인 (예: `https://mountain-safety-api.onrender.com`)

### 방법 B — Web Service 수동 생성

| 항목 | 값 |
|------|-----|
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |

환경변수:

| Key | 설명 |
|-----|------|
| `MOUNTAIN_FORECAST_API_KEY` | 기상청 산악예보 API 키 (Secret) |
| `MOUNTAIN_FORECAST_API_URL` | API 엔드포인트 URL |

> API 키는 Render에만 저장합니다. Vercel 프론트에는 **넣지 않습니다**.

## Vercel 배포

저장소 루트 `vercel.json`이 빌드·SPA rewrite를 설정합니다.

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | Render URL (예: `https://mountain-safety-api.onrender.com`) |

설정 후 **Redeploy**해야 프론트 빌드에 반영됩니다.

### 배포 아키텍처

```
Vercel (React SPA + 정적 JSON)
    │  VITE_API_BASE_URL
    ▼
Render (FastAPI) ── MOUNTAIN_FORECAST_API_KEY ──▶ 기상청 API허브
```

## 주요 기능

- **4,705개 산** 목록·검색·페이지네이션 (`mountain_code` 기준)
- **산별 위험지수** (0~100): 사고빈도·중증도·계절·시간대 가중
- **사고 유형 분석**: 실족추락 / 개인질환 / 일반조난 / 기타산악
- **12문항 체크리스트**: 준비도 점수 + 산별 맞춤 경고
- **전국 위험지수 지도**: Leaflet CircleMarker (4,705개)
- **산 상세**: 관리주체·연락처·기후 탭 (API 연동 시)
- **통계 대시보드**: 전국·산별 사고 현황

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/mountains` | 산 목록·검색·페이지네이션 |
| GET | `/api/mountains/{mountain_code}` | 산 상세 |
| GET | `/api/mountains/{mountain_code}/weather` | 산악예보 (API 키 필요) |
| GET | `/api/accident-types` | 사고 유형 가이드 |
| POST | `/api/checklist/evaluate` | 체크리스트 평가 |
| GET | `/api/stats/overview` | 전국 통계 |
| GET | `/api/risk-map` | 지도용 좌표 |

## 위험지수 공식

```
위험지수 = 사고빈도(40%) + 중증도(30%) + 계절(15%) + 시간대(15%)
등급: LOW(0~30) / MEDIUM(31~60) / HIGH(61~80) / VERY_HIGH(81~100)
```

## 산악예보 연동

1. PDF 부록의 예보 지점 목록으로 `json/mountain_forecast_stations.json` 작성
2. `py scripts/build_forecast_map.py` → `json/mountain_forecast_map.json`
3. `py scripts/etl_v2.py` 재실행
4. Render에 `MOUNTAIN_FORECAST_API_KEY`, `MOUNTAIN_FORECAST_API_URL` 설정

현재 stub 20개 지점 기준 **40개 산** 매핑됨.
