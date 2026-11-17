# AX_COACH_PLAN

AX Coach는 **규칙 기반 우선순위**로 오늘 처리할 일 1~3개를 고릅니다 (`src/lib/rules.ts: coachMissions`). AI 예측이 아닙니다.

## AX Owner
**UNKNOWN** — 실제 운영자 확정 후 지정. 책임: KPI·데이터 품질·직원 교육·이슈.

## Today Mission 후보 → Route
| 미션 | 조건 | 우선순위 | Route | 남는 Proof | 권한 |
|---|---|---|---|---|---|
| 방문·구매 확인 N건 | 열린 확인 요청 ≥1 | 100+N (최우선) | `/ax/queue` | VERIFIED_VISIT / VERIFIED_PURCHASE | 직원 |
| 고객 요청·검토 | 탈퇴·보상 검토 | 80 | `/ax/queue?tab=other` | – | 책임자 |
| 재구매 안내 후보 검토 | 후보 ≥1 | 60+N | `/ax/reorder` | REORDER_CONVERTED(구매 시) | 책임자 |
| 미방문/첫 이용 전 캠페인 | 세그먼트 ≥1 | 40+N | `/ax/campaigns?segment=` | CAMPAIGN_SENT | 책임자 |
| 사진 공개 승인 | 대기 ≥1 | 30 | `/ax/content?tab=photos` | – | 책임자 |

`Mission → Action → Result → Proof Event` 가 남도록 각 미션은 실제 처리 화면으로 연결됩니다.

## Weekly Evidence Target
Baseline 측정 전에는 수치 목표를 두지 않고, 주간 실적(확인 이용·추천 전환·재구매 전환·처리 시간)만 보여줍니다. `/ax/coach`

## Adoption Risk
| 위험 | 신호 | 대응 |
|---|---|---|
| 바쁜 시간 확인 지연 | 대기 30분+ 빨간 표시 | 카운터 등록(회원코드)으로 1단계 처리 |
| 직원 확인 생략 | 체크인 요청 대비 확인 비율 하락 | 큐 배지, 미션 1순위 |
| 고객이 회원코드를 안 보여줌 | 자가신고 비율↑ | 계산대 안내문, 체크인 코드 게시 |
| 혜택 원가 부담 | 쿠폰 사용률·금액 | 규칙에서 혜택 조정(책임자) |

## Result 확인 방식
각 Proof Event의 `kpi_before / kpi_after`, 회원 상세의 확인 이용 이력, 캠페인 대상 고객의 이후 확인 이용.

## DEMO 단계 주의
AX Coach를 운영형처럼 꾸미지 않습니다. 현재 미션은 시드 데이터 기반이며, 실제 매장 운영 시작 후 의미가 생깁니다.
