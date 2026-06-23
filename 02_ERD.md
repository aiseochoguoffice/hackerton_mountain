# 📊 ERD — 산행 안전 서비스 데이터베이스 설계

---

## 1. ERD 다이어그램 (Mermaid)

```mermaid
erDiagram

    %% ─── 산 정보 ───────────────────────────────
    MOUNTAIN {
        bigint      id              PK
        varchar(100) name          UK  "산 이름 (예: 북한산)"
        varchar(50)  region_city       "시도 (예: 서울특별시)"
        varchar(50)  region_district   "구/군 (예: 강북구)"
        decimal(9,6) latitude          "위도"
        decimal(9,6) longitude         "경도"
        int          elevation_m        "최고 고도(m)"
        varchar(20)  difficulty        "EASY/MODERATE/HARD/EXPERT"
        text         description        "산 소개"
        text         caution_notes      "특이 유의사항"
        int          risk_score         "위험 지수 0~100 (계산값)"
        varchar(20)  risk_level         "LOW/MEDIUM/HIGH/VERY_HIGH"
        timestamp    risk_updated_at    "위험지수 최종 계산 시각"
        timestamp    created_at
        timestamp    updated_at
    }

    %% ─── 등산로 ─────────────────────────────────
    TRAIL {
        bigint      id              PK
        bigint      mountain_id     FK
        varchar(100) name               "코스명 (예: 백운대 코스)"
        decimal(5,2) distance_km        "거리(km)"
        int          estimated_min      "예상 소요 시간(분)"
        varchar(20)  difficulty         "EASY/MODERATE/HARD/EXPERT"
        text         route_description  "코스 설명"
        text         danger_points      "위험 구간 설명"
        timestamp    created_at
    }

    %% ─── 사고 원본 데이터 (소방청 현황) ─────────
    ACCIDENT_RECORD {
        bigint       id              PK
        date         reported_date       "신고년월일"
        time         reported_time       "신고시각"
        varchar(50)  region_city         "발생장소_시"
        varchar(50)  region_district     "발생장소_구"
        varchar(50)  region_dong         "발생장소_동"
        varchar(50)  region_ri           "발생장소_리"
        varchar(20)  cause_category      "사고원인 (산악/기타)"
        varchar(50)  cause_detail        "사고원인코드명_사고종별"
        varchar(50)  result_code         "처리결과코드"
        int          rescued_count        "구조인원"
        bigint       mountain_id     FK  "NULL 가능 (매핑 전)"
        varchar(20)  data_source         "현황/구조활동"
        timestamp    created_at
    }

    %% ─── 사고 원본 데이터 (소방청 구조활동) ──────
    RESCUE_RECORD {
        bigint       id              PK
        date         reported_date
        time         reported_time
        date         dispatch_date       "출동년월일"
        time         dispatch_time       "출동시각"
        varchar(50)  region_city
        varchar(50)  region_district
        varchar(50)  region_dong
        varchar(50)  region_ri
        varchar(50)  lot_number          "번지 (산1-1 형태)"
        varchar(30)  cause_code          "사고원인 (실족추락/개인질환/조난/기타)"
        int          rescued_count
        bigint       mountain_id     FK
        timestamp    created_at
    }

    %% ─── 사고 유형 마스터 ────────────────────────
    ACCIDENT_TYPE {
        int          id              PK
        varchar(50)  code            UK  "SLIP_FALL/ILLNESS/LOST/OTHER"
        varchar(50)  name_ko             "실족추락/개인질환/일반조난/기타산악"
        text         description
        text         prevention_tips     "예방법 (줄글)"
        text         emergency_action    "응급 조치 요령"
        varchar(10)  icon_emoji
        timestamp    created_at
    }

    %% ─── 산-사고유형 통계 (집계 캐시) ───────────
    MOUNTAIN_ACCIDENT_STAT {
        bigint       id              PK
        bigint       mountain_id     FK
        int          accident_type_id FK
        int          year
        int          month           "NULL = 연간 집계"
        int          count               "사고 건수"
        int          rescued_total        "구조 인원 합계"
        int          severe_count         "중증 (항공대인계) 건수"
        timestamp    calculated_at
    }

    %% ─── 체크리스트 항목 마스터 ─────────────────
    CHECKLIST_ITEM {
        int          id              PK
        varchar(30)  category            "EQUIPMENT/HEALTH/WEATHER/COMPANION/ROUTE"
        varchar(200) question_ko         "체크 문항 (한국어)"
        text         tip_ko              "관련 팁"
        int          weight              "위험 가중치 1~5"
        boolean      is_critical         "필수 체크 여부"
        int          sort_order
        timestamp    created_at
    }

    %% ─── 사용자 체크 세션 ───────────────────────
    CHECK_SESSION {
        bigint       id              PK
        varchar(36)  session_uuid    UK  "익명 세션 UUID"
        bigint       mountain_id     FK
        int          total_score         "총점 (100점 만점)"
        varchar(20)  risk_level          "LOW/MEDIUM/HIGH"
        jsonb        answers             "{ item_id: true/false, ... }"
        text         ai_advice           "AI 맞춤 조언 (선택)"
        timestamp    checked_at
    }

    %% ─── 날씨 캐시 ─────────────────────────────
    WEATHER_CACHE {
        bigint       id              PK
        bigint       mountain_id     FK
        varchar(20)  condition           "CLEAR/CLOUDY/RAIN/SNOW/FOG"
        decimal(4,1) temperature_c
        int          wind_speed_mps
        int          visibility_m
        int          risk_adjustment     "날씨로 인한 위험지수 보정값"
        timestamp    fetched_at
        timestamp    expires_at
    }

    %% ─── 관계 정의 ─────────────────────────────
    MOUNTAIN         ||--o{ TRAIL                    : "has"
    MOUNTAIN         ||--o{ ACCIDENT_RECORD          : "located_at"
    MOUNTAIN         ||--o{ RESCUE_RECORD            : "located_at"
    MOUNTAIN         ||--o{ MOUNTAIN_ACCIDENT_STAT   : "aggregated_by"
    MOUNTAIN         ||--o{ CHECK_SESSION            : "checked_for"
    MOUNTAIN         ||--o{ WEATHER_CACHE            : "weather_for"
    ACCIDENT_TYPE    ||--o{ MOUNTAIN_ACCIDENT_STAT   : "typed_by"
    CHECKLIST_ITEM   }o--o{ CHECK_SESSION            : "answered_in (jsonb)"
```

---

## 2. 테이블별 설계 의도

### `MOUNTAIN`
- `risk_score`는 별도 배치 잡이 주기적으로 ACCIDENT_RECORD 집계 후 갱신
- `difficulty`는 국토지리정보원 등산로 데이터 기준

### `ACCIDENT_RECORD` / `RESCUE_RECORD`
- 소방청 원본 CSV를 **그대로** 적재 (원천 데이터 보존)
- `mountain_id`는 지명 매핑 후 FK 연결 (초기에는 NULL 허용)
- 두 테이블을 분리한 이유: 컬럼 구조 상이 (출동시각, 번지 등 차이)

### `MOUNTAIN_ACCIDENT_STAT`
- `ACCIDENT_RECORD` + `RESCUE_RECORD`의 집계 캐시 테이블
- year/month 조합으로 연간/월간 통계 조회 가능
- API 응답 속도 최적화 목적

### `CHECK_SESSION`
- 회원가입 없이 사용 가능 (익명 UUID 세션)
- `answers`를 jsonb로 저장해 항목 추가/변경에 유연 대응
- `ai_advice`는 향후 Claude API 연동 확장 포인트

### `WEATHER_CACHE`
- 기상청 API TTL 30분 캐싱
- `risk_adjustment`로 실시간 날씨가 위험 지수에 반영

---

## 3. 인덱스 전략

```sql
-- 산 검색
CREATE INDEX idx_mountain_name ON MOUNTAIN(name);
CREATE INDEX idx_mountain_region ON MOUNTAIN(region_city, region_district);
CREATE INDEX idx_mountain_risk ON MOUNTAIN(risk_score DESC);

-- 사고 데이터 집계
CREATE INDEX idx_accident_mountain ON ACCIDENT_RECORD(mountain_id);
CREATE INDEX idx_accident_date ON ACCIDENT_RECORD(reported_date);
CREATE INDEX idx_accident_cause ON ACCIDENT_RECORD(cause_detail);

-- 통계 빠른 조회
CREATE INDEX idx_stat_mountain_year ON MOUNTAIN_ACCIDENT_STAT(mountain_id, year, month);

-- 날씨 캐시
CREATE INDEX idx_weather_mountain ON WEATHER_CACHE(mountain_id, expires_at);
```
