# EVIDENCE_PLAN — 12주 실증 계획

> 현재 상태: **DEMO** — 화면의 모든 수치는 시드 데이터입니다. 실제 실적으로 인용하지 마세요.

## Baseline
| KPI | 현재 Baseline | 측정 방법 (Week 0) |
|---|---|---|
| COST · 확인 요청 처리 시간 | **REQUIRED / UNKNOWN** | 도입 전: 종이 스탬프·쿠폰 확인에 걸리는 시간을 1주간 표본 기록(직원 체크시트). 도입 후: 시스템의 `created_at → decided_at` |
| REVENUE · 30일 재방문·재구매율 | **REQUIRED / UNKNOWN** | 도입 전 측정 불가(고객 식별 없음) → 도입 첫 30일을 Baseline으로 사용하고 이후 30일과 비교 |
| SCALE · 운영자 1인당 활성 고객 | **REQUIRED / UNKNOWN** | 운영 인원 확정 후 시스템 집계 |

목표값: **DO NOT INVENT** — Baseline 측정 후 운영자와 합의.

## 12주
| 주차 | 목표 | 수집 지점 | 완료 기준 |
|---|---|---|---|
| Week 0 | Baseline Lock | 직원 체크시트, 매장 POS 일 매출(운영자 제공 시) | 3개 KPI 기준값 기록 |
| Week 1~4 | Adoption · First Proof | 체크인 수, 회원코드 제시율, 확인 처리 시간 | VERIFIED_VISIT/PURCHASE 이벤트가 매일 발생, 첫 REFERRAL_CONVERTED |
| Week 5~8 | Business Lift | 캠페인 승인→확인 이용, 재구매 전환, 쿠폰 원가 | CAMPAIGN_SENT 이후 대상 고객의 확인 이용 비교 |
| Week 9~12 | Enterprise Value / Judge Pack | Proof 묶음, 운영 절차, 정기픽업 관심도 | Evidence Pack(JSON + 보고서) |

## Data Source / Provenance
- 모든 실적 숫자는 `직원 확인` 이상 근거에서만 계산 (`src/lib/rules.ts: verifiedUses`)
- 링크 클릭·자가신고는 '의향 신호'로 따로 보고
- 매출 금액은 직원이 입력한 확인 건만 합산 — 전체 매출 아님

## Operating Evidence (수집 예정)
처리 시간 · 확인 이용 수 · 재이용 고객 수 · 쿠폰 사용률 · 추천 전환 · 재구매 전환 · 앱 알림 수신 동의율

## Enterprise Value Evidence (판단 예정)
표준화된 확인 절차 · 회원별 이용 데이터 축적 · 대표 개인의존도 감소(직원도 확인 가능) · 정기픽업 수요 신호 · 다른 매장 적용 가능성

## Government Story / Investor Story (분리)
- 정부·정책: 현장 문제 → 실사용 실증 → 생산성·매출 지표 → 지역 소상공인 확산 가능성
- 투자·성장: 반복 수요 → 정기픽업 반복매출 → Unit Economics → 확장. **현재 숫자가 없어 주장하지 않음.**
- 정책자금·LIPS·투자 선정은 보장되지 않음.

## Evidence Pack 내보내기
운영 AX > Proof·12주 실증 > `Evidence Pack(JSON)` — KPI + 모든 Proof Event.
