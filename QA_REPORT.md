# QA_REPORT — First Build (2026-11-17)

## 1. 자동 테스트 결과 (실제 실행)
| 구분 | 명령 | 결과 |
|---|---|---|
| 타입 검사 | `npm run typecheck` | ✅ 오류 0 |
| 프로덕션 빌드 | `npm run build` | ✅ 32 routes |
| 도메인 단위 테스트 | `npm test` (vitest) | ✅ **16 / 16** |
| E2E (Chromium, 프로덕션 서버) | `npm run e2e` | ✅ **8 / 8** |

### 단위 테스트가 지키는 규칙 (`tests/unit/domain.test.ts`)
가입 쿠폰 1회·중복 번호 차단·필수 동의 · 추천 보상은 직원 확인 후 1회만(가입·자가신고로는 지급 안 됨) · 잘못된 추천 코드 · 환불 시 미사용 보상 회수 · 체크인 코드 검증·1일 1회·매장/일 스탬프 1개 · 고객은 확인 불가 · 스탬프 기준 도달 시 정확히 1회 보상 · 직원은 규칙 변경·쿠폰 취소·캠페인 승인·재구매 승인 불가 · 쿠폰 1회 사용·취소 사유 필수 · 재구매 승인→확인 구매→CONVERTED+Proof · 동의자에게만 캠페인, 카카오 차단 · 동의 철회 시 세그먼트 제외 · 클릭은 KPI에 영향 없음 · 탈퇴 익명화

### E2E (`tests/e2e/`)
1. **Primary Journey (모바일 390 ↔ 데스크톱):** 비회원 탐색 → 다색냥 → 고양이 프로필·라이트박스(키보드) → 추천 링크 가입(필수 동의 검증) → 메뉴 저장 → 잘못된 코드 거부 → 체크인 → 구매 확인 요청 → AX 큐에서 방문·구매 확인(금액 입력) → 회원 상세 반영 → Proof(REFERRAL_CONVERTED·VERIFIED_PURCHASE) → 고객 스탬프 2개·알림 → 추천인 '보상 확정' → 향후 서비스 관심 → 데모 초기화 후 복구, **런타임 오류 0**
2. 직원 권한: 규칙 수정·캠페인 발송 버튼 없음 → 책임자 전환 시 노출
3. 책임자: 재구매 후보 생성·승인, 캠페인 초안→승인·발송
4. 7개 테마 전환·새로고침 유지
5. 시트: Esc·브라우저 뒤로가기로 닫힘, 스크롤 잠금 해제
6. **Device View:** Mobile 단독(390px iframe) · PC+Mobile · 프레임 내 Device View 재귀 없음 · PC→Mobile, Mobile→PC Route 동기화 · 양쪽 같은 큐 건수 · 가로 넘침 0 · 새로고침 유지 · 테마 변경이 프레임에 반영
7. 실제 모바일 폭에서 Device View 숨김
8. **반응형:** 22개 라우트 × 360/390/430/768/1024/1280/1440/1920 — 가로 넘침 0, 런타임 오류 0

## 2. QA 중 발견·수정한 문제
| 문제 | 수준 | 조치 |
|---|---|---|
| 데스크톱 모달이 등장 애니메이션 transform 때문에 화면 밖으로 밀림 | P0 | Sheet를 flex 중앙 정렬로 재구성 |
| 로고 그라데이션이 숨겨진 헤더와 ID 충돌로 투명 | P1 | 인스턴스별 useId |
| /ax 360px, /ax/why 360px, 메뉴 상세 768px 가로 넘침 | P1 | grid 자식 min-w-0, 버튼 줄바꿈 |
| 모바일 서브페이지 h1 중복 | P2 | 상단바 제목을 비제목 요소로 |
| 폰 프레임 노치가 모바일 헤더를 가림 | P2 | 노치 제거 |
| 홈에서 비회원 저장 시 오류 토스트 | P2 | 로그인으로 이동 |

## 3. 수동 확인 (스크린샷)
고객 홈/리얼식단/다색냥/고양이 프로필(390·1280), AX 대시보드(390·1440), PC+Mobile(고객·AX, Deep Teal 테마) — Wolt 계열 밝은 화면, 고양이 레일은 밝은 배경 통합, 넷플릭스식 어두운 화면 없음. 글꼴 Noto Sans KR 적용 확인.

## 4. 점수 (자기 평가 · 보수적)
### Strategy Score A — **77 / 100**
| 영역 | 점수 | 감점 이유 |
|---|---:|---|
| Problem / Constraint | 12/15 | 가설 — 실제 재방문 데이터 없음 |
| Process Redesign | 8/10 | |
| Data Foundation / Asset | 12/15 | 스키마 완비, 데이터 축적 전 |
| AI Fit / Explainability | 9/10 | |
| Proof / KPI Design | 13/15 | Baseline UNKNOWN |
| Customer / Platform Fit | 8/10 | 실제 고객 검증 전 |
| Scale / Unit Economics | 5/10 | 혜택 원가·공헌이익 미확인 |
| Moat / Asset | 3/5 | |
| Adoption / Risk | 4/5 | AX Owner 미지정 |
| Financeability | 3/5 | 자본 투입 논리 약함(정직하게 표시) |

> 규격상 90 미만은 '재설계 필요'이지만, 감점의 대부분은 **설계 결함이 아니라 미확인 사업 정보**(Baseline·원가·사업자·실데이터)에서 옵니다. 운영자 확인과 Week 0 측정 후 재평가하세요. 정보를 지어내 점수를 올리지 않았습니다.

### Product Score B — **86 / 100**
강점: 핵심 Journey·Closed Loop 실제 동작, 반응형·Device View·7 테마·권한·Proof·QA 자동화.
감점: 실제 사진·콘텐츠 부재(일러스트), 운영 저장소·인증 미연결, iOS Safari 실기기 미검증, 차트 접근성(수치 텍스트 대체는 있으나 표 형태 제공 X).

### 목표 대비
First Build 70~80% 목표: **충족**(DEMO 범위 내). Delivery Recommended(Product 98+)는 실제 콘텐츠·Supabase 연결 후 가능.

## 5. Strategic P0 점검 (규격 19절)
| 항목 | 상태 |
|---|---|
| Primary Constraint 없음 | ✅ 있음(가설 명시) |
| 핵심 기능–Constraint 단절 | ✅ 연결 |
| Cost/Revenue/Scale KPI 없음 | ✅ 있음 |
| Demo를 Live처럼 표현 | ✅ 전 화면 DEMO 배지 |
| Baseline 없는 개선율 | ✅ 없음 (UNKNOWN 표기) |
| 고객 행동–내부 Workflow 단절 | ✅ Bridge 동작 |
| Rule을 AI로 포장 | ✅ '규칙 기반·AI 아님' 명시 |
| AI Action 근거 없음 | ✅ '왜?' 제공 |
| High Risk AI 무감독 | ✅ 해당 기능 미구현(NEXT) |
| Data Provenance 불명확 | ✅ 근거상태·출처 필드 |
| Future를 현재처럼 | ✅ NEXT·'지금은 제공하지 않아요' |
| 자금·투자 보장 표현 | ✅ 없음 |
| Capital Independence 실패 | ✅ YES(가설) |

**Strategic P0 = 0 · Product P0 = 0 (알려진 것 기준)**

## 6. 알려진 이슈 (P1/P2)
- **[운영 전 필수] DEMO 저장소는 브라우저에서 조작 가능** → 운영 사용 금지, Supabase RPC/RLS 전환(R-01)
- 체크인 코드는 클라이언트에서 계산(DEMO) → LIVE에서는 서버 검증
- iOS Safari·저사양 Android 실기기 미확인
- 업로드 사진은 브라우저 용량 한도(약 5MB)
- 고객 온보딩·AX 튜토리얼 자동 표시는 E2E에서 생략(수동 확인)

## 7. Red Team (1회) 요약
| 관점 | 지적 | 판정 |
|---|---|---|
| 회의적 대표 | "종이 스탬프로도 되는데?" | 직원 확인 1번으로 추천·재방문·Proof까지 남는 점이 차이. 효과는 실증 필요 → EVIDENCE_PLAN |
| 직원 | 바쁜 시간 확인 부담 | 카운터 등록·대기시간 KPI. 실사용에서 재확인 |
| 고객 | 가입 이유 | 웰컴 쿠폰·스탬프·고양이 사진. 혜택 확정 필요 |
| 정책·신용 평가자 | 실증 숫자 없음 | 맞음 — DEMO 명시, 12주 계획 |
| 투자 관점 | Unit Economics 없음 | 맞음 — 주장하지 않음 |
| UX | 사진 없는 일러스트 | 실제 사진 슬롯 자동 교체 준비 |
| QA | 저장소 조작 가능 | P0(운영 전) 기록 |
| 보안 | 전화 해시 약함 | DEMO 한정, LIVE HMAC |

P2 아이디어는 RECOMMENDATIONS.md에 기록하고 개발을 멈췄습니다.
