# LIVE 전환 점검표 — DEMO → PILOT → LIVE

> **현재 상태: DEMO.** Supabase 프로젝트 URL·키만 `.env`에 넣는다고 운영이 되지 않습니다.
> 앱은 아직 Supabase를 **전혀 호출하지 않으며**(데이터 어댑터 미구현), `supabase/migrations`는 **초안**입니다.
> 실제 고객 개인정보를 DEMO에 입력하지 마세요(브라우저 저장 · 조작 가능 · 암호화 없음).

## 1. 지금 무엇이 있고 무엇이 없나

| 영역 | 상태 | 근거 |
|---|---|---|
| 도메인 규칙(스탬프·쿠폰·추천·환불·동의·권한) | ✅ 구현·테스트됨 (클라이언트 TS) | `src/lib/domain.ts`, 단위 테스트 19개 |
| 데이터 저장 | ⚠ DEMO 전용 localStorage | `src/lib/store.ts` |
| Supabase 클라이언트·어댑터 | ❌ 없음 (`@supabase/supabase-js` 미설치) | — |
| 스키마 `0001_schema.sql` | 🟡 초안 — 실제 DB 적용·검증 안 함 | |
| RLS `0002_rls.sql` | 🟡 초안 — 정책 테스트 없음 | |
| RPC `0003_rpc.sql` | ❌ **미완성** — `decide_checkin` 1개만 작성, 그마저 정의되지 않은 함수 호출 | 아래 2절 |
| 인증 (휴대폰 OTP) | ❌ 없음 — DEMO는 번호 일치 로그인 | |
| 전화번호 해시 | ❌ DEMO FNV 해시 → 서버 HMAC 필요 | D-07 |
| 체크인 코드 검증 | ❌ 클라이언트 계산 → 서버 검증 필요 | D-04 |
| 사진 저장 | ❌ dataURL을 브라우저에 저장 → Storage + 공개 승인 정책 필요 | |
| 개인정보 처리방침·약관 | ❌ 초안, 법률 검토 전 | `/privacy` |
| 사업자·데이터 처리 주체 | ❌ 미확인 | PROJECT_SPEC 0절 |

## 2. 반드시 구현해야 할 서버 RPC (트랜잭션)

`src/lib/domain.ts`의 같은 이름 함수가 기준 구현이며, 단위 테스트를 SQL 통합 테스트로 옮겨 같은 결과를 확인해야 합니다.

| RPC | 핵심 보장 | 상태 |
|---|---|---|
| `signup_profile` | 필수 동의 검증, 서버 HMAC 전화 해시, 추천 귀속(자기추천·중복 차단), 가입 쿠폰 멱등 | ❌ |
| `submit_checkin` | **서버에서** 오늘 코드 검증, (user, store, day) 유니크 | ❌ |
| `decide_checkin` | 권한·상태 전이·스탬프 멱등·Proof | 🟡 작성됨, 아래 2개 미정의로 **런타임 오류** |
| `qualify_referral` | 피추천인 첫 확인 이용 → 추천인 보상 1회 | ❌ 미정의 (decide_checkin이 호출) |
| `issue_stamp_reward_if_due` | 주기별 보상 1회 | ❌ 미정의 (decide_checkin이 호출) |
| `self_report_purchase` / `decide_purchase` / `staff_record_purchase` | 자가신고 한도, 직원 확인, 재구매 전환 | ❌ |
| `reverse_use` | 환불 시 스탬프·미사용 보상 회수, 사용된 보상은 검토 큐 | ❌ |
| `redeem_coupon` / `cancel_coupon` / `reissue_coupon` | 1회 사용(row lock), 사유 필수 | ❌ |
| `refresh_reorder_candidates` / `decide_reorder` | 동의자에게만 안내 | ❌ |
| `create_campaign` / `approve_and_send_campaign` | IN_APP만, 동의자만, 책임자만 | ❌ |
| `process_deletion` | 익명화, 법정 보관 항목 분리 | ❌ |
| `update_menu_photo` / `set_cat_cover` / `review_photo` | Storage 경로, 권리 확인 필드 | ❌ |

## 3. 보안·개인정보 필수 항목
1. 모든 쓰기는 RPC로만 — 테이블 직접 insert/update 정책 금지 (0002 원칙 유지)
2. 전화번호: 서버 pepper 기반 HMAC-SHA256, 원문 미저장
3. 서비스 롤 키는 서버(Route Handler/Edge Function)에만, `NEXT_PUBLIC_` 금지
4. 직원 계정 발급·회수 절차, `staff_store_access` 관리 화면
5. 감사 로그 append-only
6. 마케팅 동의: 목적·버전·철회 시각 유지, 광고성 알림 `(광고)` 표기, 야간 발송 제한
7. 사진: 권리 확인 체크 후 업로드, 공개 승인 전 비공개 버킷
8. 탈퇴·삭제 요청 처리 SLA와 법정 보관 기준 확정

## 4. 전환 순서 (권장)
1. 사업자·처리 주체·약관 확정 → 2. Supabase 프로젝트(서울 리전) 생성 → 3. 0001/0002 적용 + RLS 테스트 → 4. 2절 RPC 구현 + SQL 테스트(현 단위 테스트 이식) → 5. `store.ts` 경계를 Supabase 어댑터로 교체(DEMO 어댑터는 개발용 유지) → 6. Auth OTP → 7. Storage → 8. 직원 1~2명 **PILOT**(실제 고객 소수, 동의) → 9. 12주 실증 → 10. LIVE

## 5. 이번 2차 작업에서 바뀐 것
- AX 설정 > 데이터·권리 화면에서 Supabase를 'READY'가 아닌 **'NEXT — 초안, 키만으로 동작 안 함'**으로 표시
- `0003_rpc.sql` 상단에 미완성·런타임 오류 경고 추가
- 운영 전환 작업은 수행하지 않음(자격증명·처리 주체 미확정)


## 4차 추가 (2026-11-18)
- [ ] LIVE 빌드는 `NEXT_PUBLIC_DATA_MODE=live` 로 — 고객 화면의 '시연용 AX 보기'·DEMO 도구의 AX 이동·푸터 '매장 운영자(시연)' 가 사라지는지 확인
- [ ] `/ax` 전체를 인증된 직원·관리자만 접근하도록 서버 측 보호(미들웨어·RLS) — 버튼 숨김만으로는 보호가 아님
- [ ] 운영자 프로필(사이드바 하단)을 로그인 사용자 프로필(`Profile.name`·`Profile.title`)로 연결, 'DEMO' 배지 제거 조건 확인
- [ ] '제작 · 미래에이아이랩' 링크를 넣는다면 공식 주소 확인 후
