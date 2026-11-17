# PROOF_EVENT_SCHEMA

실증 최소 단위. 로그인 수·스크린샷만으로 실증이라 하지 않습니다.

```
Trigger / Problem → Recommendation / Decision → Human Approval → Action → Result → KPI Delta → Data Source → User / Time
```

## 필드
| 필드 | 타입 | 설명 |
|---|---|---|
| proof_event_id | uuid | 식별자 |
| event_type | enum | 아래 유형 |
| trigger | text | 무엇이 시작했나 |
| decision | text | 무엇을 결정했나 |
| decision_method | RULE / HUMAN / RULE+HUMAN | 결정 방식 (AI 사용 시 LLM 추가 예정) |
| why | text | 근거 |
| human_approval | uuid? | 승인한 운영자 |
| action | text | 실행한 조치 |
| result | text | 결과 |
| kpi_before | text? | 변화 전 |
| kpi_after | text? | 변화 후 |
| data_source | text | `테이블/ID` 경로 |
| user_id | uuid? | 관련 고객 |
| created_at | timestamptz | 기록 시각 |
| result_confirmed_at | timestamptz? | 결과 확정 시각 |
| evidence_link | text? | 근거 화면 경로 |
| status | DEMO / PILOT / LIVE | 데이터 단계 |

## 유형과 생성 시점 (`src/lib/domain.ts`)
| event_type | 생성 시점 | decision_method |
|---|---|---|
| VERIFIED_VISIT | 직원이 체크인 확인 | RULE+HUMAN (코드 일치 + 직원) |
| VERIFIED_PURCHASE | 직원이 구매 확인/카운터 등록 | HUMAN |
| STAMP_REWARD | 스탬프 기준 도달 → 보상 쿠폰 | RULE |
| REFERRAL_CONVERTED | 피추천인 첫 확인 이용 → 추천인 보상 | RULE+HUMAN |
| REORDER_CONVERTED | 승인된 재구매 안내 대상 메뉴가 확인 구매됨 | RULE+HUMAN |
| CAMPAIGN_SENT | 책임자 승인 후 앱 알림 발송 (성과는 이후 확인 이용으로 측정) | RULE+HUMAN |

## 예시
```json
{
  "event_type": "REFERRAL_CONVERTED",
  "trigger": "추천 코드 AB3CD로 가입",
  "decision": "피추천인 첫 이용 직원 확인",
  "decision_method": "RULE+HUMAN",
  "why": "추천 보상은 가입이 아니라 확인된 첫 이용 후에만 지급(중복·허위 방지)",
  "human_approval": "op_staff",
  "action": "추천인 보상 쿠폰 발급",
  "result": "120겹파이 1개 무료 발급",
  "kpi_before": "추천 전환 대기",
  "kpi_after": "추천 전환 1건",
  "data_source": "referral_attributions/ref_…",
  "status": "DEMO"
}
```
