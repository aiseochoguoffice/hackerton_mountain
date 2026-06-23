# Open Source Notice

본 서비스(산행 안전 지도)는 아래 오픈소스 및 공개 데이터·서비스를 활용하여 구현되었습니다.

## Frontend

| 이름 | 버전 | 라이선스 | 용도 |
|------|------|----------|------|
| [React](https://react.dev/) | ^19.0.0 | MIT | UI 프레임워크 |
| [React DOM](https://react.dev/) | ^19.0.0 | MIT | DOM 렌더링 |
| [React Router](https://reactrouter.com/) | ^7.1.0 | MIT | SPA 라우팅 |
| [Vite](https://vitejs.dev/) | ^6.0.0 | MIT | 빌드·개발 서버 |
| [TypeScript](https://www.typescriptlang.org/) | ~5.7.2 | Apache-2.0 | 정적 타입 |
| [Tailwind CSS](https://tailwindcss.com/) | ^4.0.0 | MIT | 스타일링 |
| [@tailwindcss/vite](https://tailwindcss.com/) | ^4.0.0 | MIT | Vite Tailwind 연동 |
| [Leaflet](https://leafletjs.com/) | ^1.9.4 | BSD-2-Clause | 지도 렌더링 |
| [react-leaflet](https://react-leaflet.js.org/) | ^5.0.0 | Hippocratic-2.1 | React 지도 컴포넌트 |
| [Recharts](https://recharts.org/) | ^2.15.0 | MIT | 차트 시각화 |

## Backend

| 이름 | 버전 | 라이선스 | 용도 |
|------|------|----------|------|
| [FastAPI](https://fastapi.tiangolo.com/) | >=0.115.0 | MIT | REST API |
| [Uvicorn](https://www.uvicorn.org/) | >=0.32.0 | BSD-3-Clause | ASGI 서버 |
| [Pydantic](https://docs.pydantic.dev/) | >=2.10.0 | MIT | 데이터 검증 |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | >=1.0.0 | BSD-3-Clause | 환경변수 로드 |
| [httpx](https://www.python-httpx.org/) | >=0.28.0 | BSD-3-Clause | HTTP 클라이언트 |

## 지도·외부 리소스

| 이름 | 라이선스 / 약관 | 용도 |
|------|-----------------|------|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | ODbL | 일반 지도 타일 |
| [Esri World Imagery](https://www.esri.com/) | Esri 이용 약관 | 위성 지도 타일 |
| [Leaflet CSS (unpkg CDN)](https://unpkg.com/leaflet/) | BSD-2-Clause | 지도 스타일시트 |

## 데이터 출처

| 이름 | 제공처 | 용도 |
|------|--------|------|
| 전국 산악사고 구조활동현황 | [소방청 · 공공데이터포털](https://www.data.go.kr/) | 사고 통계·위험지수 산출 |

## Python 표준 라이브러리

ETL 스크립트(`scripts/etl_load_csv.py`)는 `csv`, `json`, `pathlib`, `collections`, `datetime` 등 Python 표준 라이브러리를 사용합니다.

---

각 프로젝트의 라이선스 전문은 해당 저장소 및 공식 문서를 참고해 주세요.

**제작**: Deep Think · **2026 AI 챔피언 해커톤**
