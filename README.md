# 산행 안전 지도 — 소방청 산악사고 데이터 기반 웹 서비스

등산객에게 **전국 산별 위험지수**, **사고 유형 통계**, **유의사항·행동요령**, **산행 전 체크리스트**를 제공하는 반응형 웹 서비스입니다.

## 데이터 소스

- `data/소방청_전국 산악사고 현황_20241231.csv` (~10,134건)
- `data/소방청_전국 산악사고 구조활동현황_20201231.csv` (~13,189건)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| Backend | FastAPI + Uvicorn |
| 데이터 | JSON (집계) + CSV ETL |
| 배포 | Vercel (Frontend) |

## 프로젝트 구조

```
hackerton/
├── frontend/          # React SPA (Vercel 배포)
├── backend/           # FastAPI REST API
├── scripts/           # CSV → JSON ETL
├── json/              # 집계 데이터 (ETL 산출)
└── data/              # 원본 CSV (Git 제외)
```

## 로컬 실행

### 1. ETL (CSV → JSON)

```powershell
py scripts/etl_load_csv.py
```

### 2. Backend (선택 — 로컬 API)

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

> Vercel 배포 시 `frontend/public/data/*.json` 정적 파일을 사용하므로 백엔드 없이도 동작합니다.

## Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
2. **Root Directory**: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. (선택) Environment Variable: `VITE_API_BASE_URL` = 백엔드 URL

## 주요 기능

- **산별 위험지수** (0~100): 사고빈도·중증도·계절·시간대 가중
- **사고 유형 분석**: 실족추락 / 개인질환 / 일반조난 / 기타산악
- **12문항 체크리스트**: 준비도 점수 + 산별 맞춤 경고
- **전국 위험지수 지도**: Leaflet 기반
- **통계 대시보드**: 전국·산별 사고 현황

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/mountains` | 산 목록·검색 |
| GET | `/api/mountains/{id}` | 산 상세 |
| GET | `/api/accident-types` | 사고 유형 가이드 |
| POST | `/api/checklist/evaluate` | 체크리스트 평가 |
| GET | `/api/stats/overview` | 전국 통계 |
| GET | `/api/risk-map` | 지도용 좌표 |

## 위험지수 공식

```
위험지수 = 사고빈도(40%) + 중증도(30%) + 계절(15%) + 시간대(15%)
등급: LOW(0~30) / MEDIUM(31~60) / HIGH(61~80) / VERY_HIGH(81~100)
```
