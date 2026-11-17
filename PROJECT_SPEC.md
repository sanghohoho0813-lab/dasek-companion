# PROJECT_SPEC — 다색컴패니언 | DASEK COMPANION

> Mobile-first wellness membership platform and connected business AX for Real Sicdan & Dasek Nyang.
> 기준 규격: 미래AI랩 AX + Platform Unified Design & Development System v4.1 · 다색컴패니언 1차 개발 마스터 프롬프트 v1.0
> 작성: 2026-11-17 · 단계: **DEMO (First Build)**
> 참고: `다색컴패니언 AX + 고객 플랫폼 1차 전략·제품 기획서 v0.1`은 제공되지 않아 마스터 프롬프트를 기준으로 작성함.

---

## 0. 근거 상태 표기

| 표기 | 의미 |
|---|---|
| **VERIFIED** | 운영자가 직접 확인·입력한 값 (현재 없음) |
| **USER_PROVIDED** | 사용자가 제공한 정보 (2026-11-17 네이버 플레이스 공개정보 포함) |
| **ASSUMPTION** | 개발을 위해 둔 가정 — 운영자 확정 필요 |
| **UNKNOWN** | 미확인 — 화면에 '확인 중/매장 문의'로 표시 |

### 확인된 사실 (USER_PROVIDED)
- 다색냥 주소: 경기 고양시 덕양구 꽃내음1길 88 지층 · 향동천 산책길 위치
- 21:00 영업 종료 (요일별 시작 시간·휴무일은 UNKNOWN)
- 전화 0507-1370-5404 (네이버 연결번호일 수 있음)
- 인스타그램 https://www.instagram.com/dasek_nyang · 네이버 예약 메뉴 존재
- 편의: 포장, 남/녀 화장실 구분, 무선 인터넷, 간편결제
- 대표 메뉴 120겹파이 4,500원 · 기본 음료는 머신 제공, 추가 메뉴는 데스크 주문
- 공개 리뷰 요약에 닭가슴살 샐러드·다이어트 도시락 언급
- 매장에서 샐러드 등 식단, 무인 음료, 애플파이 등 디저트 판매, 배달 운영 (사용자 설명)

### 가정 (ASSUMPTION)
- 리얼식단 메뉴는 다색냥과 **같은 매장**에서 판매된다 → 리얼식단 '매장'을 별도 store로 두되 주소는 가정 표시
- 혜택 내용(가입 1,000원 할인, 스탬프 10개 보상, 추천 보상 120겹파이 1개 등)은 모두 **예시**
- 예시 메뉴 7종(연어 포케 등)과 가격은 시연용
- 고양이 6마리·이름(모카·보리·구름·콩떡·단풍·라떼)은 **예시 프로필** — 실제 수·이름 미확인

### 미확인 (UNKNOWN)
두 사업의 사업자번호·매출 귀속·데이터 처리 주체 / 리얼식단 가맹 여부·상표·메뉴 이미지 권리 / 전체 영업시간·이용요금 / 배달·온라인 주문 채널 / POS·키오스크 / 영양·알레르기 / 실제 고양이 정보·사진 / AX Owner

---

## 1. AX VERDICT — **LITE → GO (조건부)**
반복 고객·거래(매장 매출)가 이미 있고, 이용 데이터가 매일 생긴다. 다만 규모·Baseline이 없으므로 **회원·혜택·확인 큐·재방문 관리(LITE 핵심)**부터 만들고, 12주 실증 결과로 FULL(정기픽업·구독) 여부를 판단한다.

**Capital Independence Test: YES (가설)** — 정책자금 없이도 종이 스탬프 대체·재방문 관리·추천 기록만으로 매장 운영 가치가 있다. 실제 효과는 Week 0 Baseline 이후 검증.

## 2. PRIMARY CONSTRAINT (가설 · REVENUE LEAK)
> 매장에서 구매·방문한 고객이 **누구인지·언제 다시 올지 알 수 없어**, 한 번의 이용이 재방문·재구매로 연결되지 못한다.
> 이번 프로젝트의 핵심은 **확인된 이용을 회원에 연결**하고, 다시 올 이유(혜택·고양이·저장 메뉴)를 운영자가 관리하게 만드는 것이다.

핵심 기능의 대부분(회원·스탬프·쿠폰·추천·확인 큐·재구매·캠페인)이 이 Constraint에 직접 연결된다.

## 3. PROCESS REDESIGN

| 현재 단계 | 문제 | 제거 | 표준화 | 디지털화 | 자동화 | AI 필요 | 최종 상태 |
|---|---|---|---|---|---|---|---|
| 종이 스탬프·구두 혜택 | 분실·중복·기록 없음 | 종이 스탬프 | 회원코드 제시 | 확인 버튼 | 스탬프·보상 자동 | 아니오 | 직원확인 1회 → 원장 기록 |
| 단골 기억 | 사람마다 다름 | – | 회원 프로필 | 이용 이력 | – | 아니오 | 회원 상세 화면 |
| 재방문 안내 | 없음 | – | 세그먼트 규칙 | 앱 알림 | 후보 자동 생성 | 아니오(RULE) | 책임자 승인 후 발송 |
| 추천 | 입소문 | – | 추천 코드 | 귀속 기록 | 첫 이용 후 보상 | 아니오 | 멱등 보상 |
| 문안 작성 | 시간 소요 | – | 템플릿 | – | 초안 | LLM 선택(READY) | 승인 후 발송 |

## 4. CORE VALUE 3 + MONEY KPI 3

| 가치 | KPI | 측정 지점 | Baseline |
|---|---|---|---|
| COST — 확인·응대 시간 | 확인 요청 처리 시간(중앙값, 분) | `checkins/verifications.created_at → decided_at` | REQUIRED / UNKNOWN |
| REVENUE — 재방문·재구매 | 30일 확인 재이용률 | 직원확인 이용 2회+ 고객 ÷ 1회+ 고객 | REQUIRED / UNKNOWN |
| SCALE — 같은 인력으로 더 많은 단골 | 운영자 1인당 30일 활성 고객 | 확인 이용 고객 ÷ 운영 인원 | REQUIRED / UNKNOWN |

목표값은 Baseline 측정 전 **만들지 않는다(DO NOT INVENT)**.

## 5. PRIMARY CONVERSION
- 고객: **가입 → 매장 방문·구매 → 직원 확인(스탬프)** 이 1차 전환.
- 보조: 메뉴 저장(관심) → 재구매 / 추천 코드 공유 → 친구 첫 이용.

## 6. CUSTOMER JOURNEY (고객별)
| 고객 | Job-to-be-done | 진입 |
|---|---|---|
| 리얼식단 고객 | 가볍고 든든한 한 끼를 빨리 고르기 | 홈 → 리얼식단 → 메뉴 상세 → 저장 / 매장 구매 |
| 다색냥 방문객 | 어떤 고양이가 있는지 보고 방문 결정 | 홈 → 다색냥 → 고양이 레일 → 프로필 → 예약 링크/체크인 |
| 단골 | 혜택이 쌓이는지 확인 | 마이 → 스탬프·쿠폰·이용 내역 |

두 서비스는 **독립 진입 경로**를 가진다. 모든 고객이 양쪽에 관심 있다고 가정하지 않는다(가입 시 관심 브랜드 선택).

## 7. CUSTOMER EVENT → AX MAP (Closed Loop)
| Flow | Trigger | Decision/Rule | Human Approval | Action | Result | Proof | Customer Feedback |
|---|---|---|---|---|---|---|---|
| A 추천 | 추천 코드 가입 | 자기추천·중복번호 차단, referee 유니크 | 직원이 첫 이용 확인 | 추천인 쿠폰 발급(멱등) | REWARDED | REFERRAL_CONVERTED | 마이 > 친구 추천 '보상 확정' + 알림 |
| B 재구매 | 메뉴 저장 | 14일 확인 구매 없음 + 동의 | 책임자 승인 | 앱 알림 안내 | 확인 구매 시 CONVERTED | REORDER_CONVERTED | 알림함 + 저장 메뉴 |
| C 방문 | 고양이 탐색 → 체크인 | 오늘 코드 일치 + 1일 1회 | 직원 확인 | 스탬프 +1, 보상 판정 | CONFIRMED | VERIFIED_VISIT | 마이 스탬프·이용 내역 + 알림 |

## 8. DATA ASSET / SSOT
DEMO: `src/lib/types.ts` (브라우저 저장) ↔ LIVE: `supabase/migrations/0001_schema.sql` — 같은 구조. 상세는 `DATA_DICTIONARY.md`.
**12-MONTH DATA QUESTION:** 메뉴별 재구매 주기·브랜드 교차 이용·정기픽업 수요 규모·혜택별 공헌이익을 판단할 수 있게 된다.
**DATA MOAT SCORE:** 5/12 (독점성 1·시간축 1·Outcome 연결 1·반복성 1·권리/품질 1·AI/사업 활용 0) — 중간.

## 9. AI METHOD MATRIX
| 기능 | Business Question | Input | Method | Output | Why | Error Cost | Approval | 상태 |
|---|---|---|---|---|---|---|---|---|
| 메뉴 추천 | 다음에 볼 메뉴 | 저장·조회·확인 구매 | RULE | 추천 + 이유 2~4 | 데이터 적음, 설명 가능 | LOW | – | LIVE |
| 재구매 후보 | 누구에게 안내할까 | 저장·구매·동의 | RULE | 후보 + 이유 | 단순 조건 | MID | 책임자(L3) | LIVE |
| 세그먼트 | 누구에게 캠페인 | 이용·동의·스탬프 | RULE | 대상 수 | 조건으로 충분 | MID | 책임자 | LIVE |
| 스탬프·추천 보상 | 보상 지급 | 확인 이용 | RULE | 쿠폰·원장 | 규정 | MID | 직원 확인 선행 | LIVE |
| KPI·전환 | 성과 | 원장·이벤트 | ANALYTICS | 집계 | 통계로 충분 | LOW | – | LIVE |
| 캠페인 문안 | 문안 초안 | 공개 메뉴·템플릿 | LLM(선택) | 초안 | 작성 시간 | MID | 책임자 | READY |
| 영양·알레르기 | 안전 | 검증 자료 | HUMAN | – | 오류 비용 큼 | HIGH | 필수 | NEXT |
| AX Coach 미션 | 오늘 할 일 | 큐·후보·세그먼트 | RULE | 1~3개 | 우선순위 규칙 | LOW | – | LIVE |

AI API Key 없음 → 실제 AI를 연결한 척하지 않는다. 화면에 '규칙 기반 추천 · AI 모델 아님'을 명시.

## 10. PROOF PLAN
`EVIDENCE_PLAN.md`, `PROOF_EVENT_SCHEMA.md` 참고. 실증 단위 = Proof Event.

## 11. PORTAL / PLATFORM VERDICT
- 고객 포털: **필요 (HIGH)** — 고양이·메뉴 탐색이 방문 의사결정에 직접 쓰이고, 혜택 확인이 재방문 동기.
- PLATFORM READINESS (외부 사업자 SaaS): **LOW** (5 테스트 중 2개: 업계 공통문제·표준화 가능) → 로드맵에만 표시.

## 12. FUTURE EXPANSION (3~6, 모두 NEXT)
정기픽업 · AI 푸드 웰니스 · 반려묘 컴패니언 · 휴식·정서 웰니스(비의료) · B2B 단체 식단 · 외부 사업자 플랫폼 — `src/lib/roadmap.ts`. 고객은 관심/출시알림만 남길 수 있다.

## 13. MOAT CANDIDATE
회원별 확인 이용 이력(Proprietary Data) · 매장 운영 표준 절차(Workflow) · 고양이카페+식단 결합 고객 관계(Switching Cost 약함). 기술스택은 Moat 아님.

## 14. RISK
| 위험 | 수준 | 대응 |
|---|---|---|
| 가맹·상표 권리 미확인 | HIGH | 리얼식단 외부 연동·브랜드 확장 금지, 타 점포 제휴 표현 금지 |
| 개인정보·마케팅 동의 | HIGH | 목적·버전별 동의, 원본 번호 미저장, 동의자만 발송 |
| 영양·알레르기 오표기 | HIGH | 검증 전 수치 미표시, '안전 보장 안 함' 고지 |
| 직원 확인 누락 | MID | 큐 배지·AX Coach·처리 시간 KPI |
| 혜택 원가 | MID | 예시 표기, 규칙 변경은 책임자 + 감사 |
| DEMO를 실적으로 오인 | MID | 모든 화면 DEMO 배지, 근거 수준 분리 |

## 15. NOT BUILDING THIS PHASE
실결제·구독 결제 / POS·배달 플랫폼 자동수집 / 카카오·푸시 실발송 / 자체 ML / 영양 자동계산 / 네이티브 앱 / 다점포 SaaS·정산 / 반려묘 건강기록 / 실제 Supabase 운영 연결(자격증명 없음). 이유는 `DECISIONS.md`.

## 16. 화면 IA
**고객 (모바일 하단 4탭: 홈 / 리얼식단 / 다색냥 / 마이)**
`/` 홈 · `/realsicdan` 메뉴 · `/menu/[id]` 상세 · `/dasek` 카페·고양이 · `/dasek/cats/[id]` 프로필·갤러리 · `/checkin` · `/membership` · `/roadmap` · `/signup` · `/login` · `/my` (+ coupons, referral, activity, saved, inbox, settings) · `/privacy`

**운영 AX (4그룹 · 1차 메뉴 12개)**
- 운영: 대시보드 `/ax` · 오늘 할 일·AX Coach `/ax/coach` · 방문·구매 확인 `/ax/queue`
- 고객·매출: 회원·동의 `/ax/members` · 메뉴·고양이 콘텐츠 `/ax/content` · 쿠폰·추천·보상 `/ax/rewards` · 캠페인 `/ax/campaigns`
- AX·성과: 고객 행동·전환 `/ax/analytics` · 추천·재구매 `/ax/reorder` · Proof·12주 실증 `/ax/evidence`
- 관리: 설정·역할·데이터 `/ax/settings` · Why AX·로드맵 `/ax/why`

## 17. PROJECT SIGNATURE (3+)
1. **고양이 사진 레일 + 프로필 캐러셀/라이트박스** (Netflix 탐색 패턴을 밝은 Wolt 톤으로 통합)
2. **'오늘의 체크인 코드' + 직원 확인** — 원격·사진 공유 체크인을 막는 매장형 검증
3. **근거 수준 분리 UI** — 링크 클릭 / 자가신고 / 직원확인 / POS를 모든 지표에서 구분
4. 자체 제작 SVG 일러스트(음식·고양이·매장) + 실제 사진 슬롯 자동 교체

## 18. DESIGN
- 고객: 흰 배경, 하늘·청록 포인트(`#55BEDD`/`#258EA8`), 세이지·아이보리 보조, 둥근 카드, 사진 중심, 카테고리 칩, 혜택 카드, 하단 내비게이션. Wolt의 로고·문구·화면 구성은 복제하지 않음.
- 글꼴: **Noto Sans KR** (next/font 자체 호스팅).
- AX: Unified 7 Canonical Theme(기본 Pure White), 그룹별 아이콘 색(운영 Blue · 고객·매출 Amber · AX·성과 Teal-Green · 관리 Slate).
- Device View: Desktop에서 `[PC] [Mobile] [PC+Mobile]`.

## 19. STRATEGIC ACCEPTANCE
- Strategic P0 = 0 (Demo/Live 혼동 없음, Baseline 없는 개선율 없음, 억지 AI 없음, 보장 표현 없음) — QA_REPORT 참조
- 핵심 Closed Loop A/B/C가 실제 화면에서 동작 (E2E 통과)
