# 다색컴패니언 | DASEK COMPANION

Mobile-first wellness membership platform and connected business AX for Real Sicdan & Dasek Nyang.

리얼식단(식단·샐러드)과 다색냥(고양이카페·음료·디저트)의 **고객 플랫폼**과 **매장 운영 AX**를 하나의 데이터로 연결한 웹앱입니다.
가입 → 메뉴·고양이 탐색 → 혜택 → 매장 방문·구매 → **직원 확인** → 스탬프·추천 보상 → 재방문·재구매 → 실증 기록(Proof)까지 실제로 동작합니다.

> **현재 단계: DEMO.** 데이터는 브라우저(localStorage)에 저장되는 시연 데이터이며 실제 고객·매출이 아닙니다. 예시 메뉴·예시 고양이 프로필·예시 혜택은 운영자 확인 후 교체해야 합니다. **이 상태로 실제 운영에 쓰지 마세요**(브라우저 저장은 조작 가능) — `RECOMMENDATIONS.md` R-01.

## 실행
```bash
npm install
npm run dev          # http://localhost:3000  (고객)  ·  http://localhost:3000/ax  (운영 AX)
```
| 명령 | 설명 |
|---|---|
| `npm run build && npm start` | 프로덕션 실행 |
| `npm test` | 도메인 규칙 단위 테스트 (vitest) |
| `npm run e2e` | E2E (Playwright, 프로덕션 빌드 필요) |
| `npm run typecheck` | 타입 검사 |
| `npm run assets:scan` | `public/assets`의 실제 사진을 등록 → 샘플 일러스트 자동 교체 |

환경 변수는 필요 없습니다(DEMO). 운영 전환용 항목은 `.env.example` 참고.

## 둘러보기
- **고객:** 하단 탭 `홈 / 리얼식단 / 다색냥 / 마이`. 마이 > 로그인에서 '시연용 계정'으로 바로 체험할 수 있습니다.
- **운영 AX:** `/ax` — 상단 `책임자/직원`으로 권한 미리보기, `PC / Mobile / PC+Mobile`로 기기 동시 보기, 설정에서 7개 테마.
- **체크인 체험:** AX 대시보드의 '오늘의 체크인 코드'를 고객 화면 `/checkin`에 입력 → AX `방문·구매 확인`에서 확인.
- **데모 초기화:** 고객 데스크톱 상단 바 또는 AX 헤더의 ↺.

## 구조
```
src/
  app/(customer)/…     고객 플랫폼 화면
  app/ax/…             운영 AX 화면 (4그룹 12메뉴)
  components/          ui · customer · ax · device(Device View) · art(자체 일러스트)
  lib/types.ts         도메인 타입 (Supabase 스키마와 1:1)
  lib/domain.ts        모든 상태 변경(가입·체크인·확인·보상·캠페인·권한)
  lib/rules.ts         RULE 엔진·세그먼트·KPI·AX Coach (AI 아님)
  lib/store.ts         DEMO 저장 어댑터 (LIVE 전환 경계)
  lib/seed.ts          DEMO 시드 (근거 상태 표기)
supabase/migrations/   스키마·RLS·RPC (READY — 미적용)
tests/unit · tests/e2e
```

## 기술
Next.js 15 (App Router) · TypeScript · Tailwind CSS · lucide-react · Noto Sans KR(next/font 자체 호스팅) · Vitest · Playwright · (READY) Supabase

## 인수인계 문서
[PROJECT_SPEC](PROJECT_SPEC.md) · [PROJECT_STATE](PROJECT_STATE.md) · [DECISIONS](DECISIONS.md) · [DATA_DICTIONARY](DATA_DICTIONARY.md) · [EVIDENCE_PLAN](EVIDENCE_PLAN.md) · [AX_COACH_PLAN](AX_COACH_PLAN.md) · [PROOF_EVENT_SCHEMA](PROOF_EVENT_SCHEMA.md) · [QA_REPORT](QA_REPORT.md) · [RECOMMENDATIONS](RECOMMENDATIONS.md) · [사진 자산 안내](public/assets/README.md)

## 권리·데이터 원칙
- 인스타그램·네이버 리뷰 사진·로고는 권리 확인 전 사용하지 않습니다. 매장 사실정보(주소·종료 시간·대표 메뉴 가격 등)만 출처와 함께 사용합니다.
- 화면의 음식·고양이·매장 이미지는 자체 제작 SVG 일러스트이며 '샘플 일러스트'로 표시됩니다.
- 결제·예약 확정·카카오/푸시 발송·POS 연동은 하지 않습니다.
