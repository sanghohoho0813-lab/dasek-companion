# DECISIONS — 중요한 설계 결정 (왜 / 왜 안 했는지 / 재검토 시점)

### D-01 · Next.js(App Router) + TypeScript + Tailwind, 신규 저장소
- **WHY:** 빈 저장소. 마스터 프롬프트·미래AI랩 표준 스택.
- **WHY NOT:** 별도 모바일 네이티브 앱 — 1차 목표는 웹 반응형, 네이티브는 NOT BUILDING.
- **REVISIT WHEN:** 푸시·오프라인 요구가 실제로 확인될 때(PWA 먼저 검토).

### D-02 · DEMO 데이터 어댑터(브라우저 localStorage) + Supabase 스키마는 READY
- **WHY:** Supabase 자격증명이 없음. 운영 DB인 척하지 않으면서 전체 흐름을 실제로 동작시키기 위해. 같은 Origin이라 PC 화면과 Mobile Frame이 같은 데이터를 공유한다.
- **WHY NOT:** 가짜 API·Mock 서버 — 동작은 하지만 '연결된 것처럼' 보일 위험.
- **구조:** 모든 변경은 `src/lib/domain.ts`의 순수 함수 → `store.dispatch` 단일 입구. LIVE 전환 시 이 경계를 Supabase RPC(`supabase/migrations/0003_rpc.sql`)로 교체.
- **REVISIT WHEN:** Supabase 프로젝트·키가 준비되면 (RECOMMENDATIONS R-01).

### D-03 · 방문·구매 '확인'은 직원 확인을 기준으로 한다
- **WHY:** POS·배달 플랫폼 연동권 미확인. 링크 클릭·자가신고를 실적으로 쓰면 KPI·보상이 부풀려진다.
- **결과:** 근거 수준 4단계(LINK_CLICK < SELF_REPORT < STAFF_CONFIRMED < POS_VERIFIED)를 모든 화면에서 분리. KPI·스탬프·추천 보상은 STAFF_CONFIRMED 이상만.
- **REVISIT WHEN:** 합법적 POS/영수증 연동이 확인되면 POS_VERIFIED 추가.

### D-04 · 체크인은 '매일 바뀌는 4자리 코드 + 직원 확인'
- **WHY:** QR 이미지는 사진 공유로 원격 체크인이 가능. 코드는 매일 바뀌고, 그래도 직원 확인을 거쳐야 적립.
- **중복 방지:** (회원, 매장, 날짜) 유니크 · 스탬프 멱등키 `stamp:{user}:{store}:{day}`.
- **WHY NOT:** GPS 위치 확인 — 위치정보 수집 동의 부담, 실내 오차.
- **REVISIT WHEN:** 카운터 혼잡으로 확인이 밀리면 QR+시간제한 토큰 검토. 카운터용 QR 이미지 출력은 R-05.

### D-05 · 추천 보상은 '가입'이 아니라 '피추천인 첫 확인 이용' 후
- **WHY:** 가입만으로 보상하면 허위·중복 가입 유인이 생긴다.
- **차단:** 존재하지 않는 코드 / 자기 자신 / 같은 전화번호 해시 / referee 1회 귀속(유니크) / 보상 멱등키 `referral:{attrId}`.
- **환불:** 자격을 만든 이용이 취소되면, 미사용 보상 쿠폰은 취소·재대기. 이미 사용됐으면 검토 큐.
- **WHY NOT 기기 지문:** DEMO가 한 브라우저에서 돌아가 모든 추천이 차단됨. LIVE에서 서버 측 위험 신호로 추가 검토.

### D-06 · 혜택 내용은 모두 예시(ASSUMPTION)
- **WHY:** 원가·운영 정책 미확정. 고객·운영 화면 모두에 '예시 혜택'임을 표시.
- 규칙 변경은 책임자만, 감사 기록 남김. 저장 시 근거상태가 USER_PROVIDED로 바뀜.

### D-07 · 전화번호 원문 미저장
- **WHY:** 최소수집. 중복가입 방지에는 해시만 필요.
- DEMO는 비암호 FNV 해시(`demoHash`) — **LIVE는 서버 pepper 기반 HMAC-SHA256로 반드시 교체**.

### D-08 · 마케팅 발송은 앱 내 알림(IN_APP)만, 사람 승인 필수
- **WHY:** 카카오·푸시는 수신동의·발송 인프라·요금·채널 정책 미확인. 자동 발송(L4)은 오류 비용이 큼.
- 동의 목적(inapp/push/kakao)·버전·철회 시각을 따로 저장. 광고성 알림은 '(광고)' 표기.
- **REVISIT WHEN:** 카카오 비즈 채널·발송 대행 계약 후.

### D-09 · AI는 RULE/ANALYTICS로 구현, LLM은 READY
- **WHY:** API Key 없음, 데이터 적음, 설명 가능성 필요. 추천마다 '사용한 정보 → 이유 → 주의 → 다음 행동'을 보여준다.
- **WHY NOT:** 칼로리·영양 AI 추정 — 오류 비용 HIGH, 검증 자료 없음.

### D-10 · 고양이·메뉴 이미지는 자체 제작 SVG 일러스트 + 사진 슬롯
- **WHY:** 실제 사진 미제공. 인스타·네이버 리뷰 사진·로고는 권리 확인 전 사용 금지.
- 일러스트에는 '샘플 일러스트', 고양이에는 '예시 프로필'을 표시해 실제처럼 속이지 않음.
- `public/assets/<슬롯>.jpg` + `npm run assets:scan` → 자동 교체. 운영자가 AX에서 고양이 사진을 올리면 공개 승인 후 노출.

### D-11 · 리얼식단을 별도 '매장(store)'으로 모델링, 주소는 가정
- **WHY:** 두 브랜드의 사업자·매출 귀속이 다를 수 있음. 데이터 키를 분리해 두면 나중에 분리 정산·접근 통제가 가능.
- **REVISIT WHEN:** 사업자 정보 확인 시 business_entity 단위 RLS 적용.

### D-12 · 고객에게 테마 스위처를 노출하지 않음
- 고객은 밝은 다색컴패니언 브랜드 테마 고정. 7개 테마는 운영 AX 설정에서만. 글자 크기는 양쪽 제공.

### D-13 · 글꼴은 Noto Sans KR (사용자 요청 2026-11-17)
- next/font/google로 빌드 시 자체 호스팅 → 런타임 외부 CDN 요청 없음.

### D-14 · Device View는 같은 앱을 iframe(390px)으로 렌더
- `?frame=mobile` 플래그, postMessage(origin·source 검증)로 양방향 Route 동기화, iframe 안에서는 Device View 미생성(재귀 차단). 실제 모바일 브라우저(≤1023px)에서는 스위처 숨김.

### D-15 · 운영자 실명 미입력
- '운영 책임자(데모)', '매장 직원(데모)'만 사용. AX Owner는 UNKNOWN.

### D-16 · 영업시간·이용요금·주문 채널은 운영자 입력 필드로
- AX > 설정 > 매장 정보에서 책임자가 입력하면 근거가 VERIFIED(운영자 확인)로 바뀌고 고객 화면에 즉시 반영.
