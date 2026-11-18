/**
 * 화면 표시용 한글 이름 — 내부 코드(영문 상수)는 데이터·테스트에 그대로 두고, 화면에는 이 이름만 보인다.
 * 새 코드를 추가하면 여기에 함께 추가한다. 모르는 코드는 '기타'로 보여 영문이 새어 나가지 않게 한다.
 */
export const PROOF_LABEL: Record<string, string> = {
  VERIFIED_VISIT: '방문 확인',
  VERIFIED_PURCHASE: '구매 확인',
  REFERRAL_CONVERTED: '친구 추천 성공',
  REORDER_CONVERTED: '재구매 전환',
  CAMPAIGN_SENT: '고객 알림 발송',
  STAMP_REWARD: '스탬프 보상',
};
export const proofLabel = (t: string) => PROOF_LABEL[t] ?? '기타 기록';

export const METHOD_LABEL: Record<string, string> = {
  RULE: '규칙',
  HUMAN: '사람 판단',
  'RULE+HUMAN': '규칙 + 직원 확인',
  ANALYTICS: '집계',
  LLM: 'AI 문장',
  TEMPLATE_RULE: '규칙 문안',
};
export const methodLabel = (m: string | null | undefined) => (m ? METHOD_LABEL[m] ?? m : '-');

export const LEDGER_KIND: Record<string, string> = { STAMP: '스탬프', COUPON: '쿠폰', REFERRAL_REWARD: '추천 보상' };
export const LEDGER_STATUS: Record<string, string> = { EXPECTED: '확정 예정', CONFIRMED: '확정', REVERSED: '회수' };
export const REFERRAL_STATUS: Record<string, string> = { PENDING: '첫 이용 대기', QUALIFIED: '보상 검토', REWARDED: '보상 확정', REJECTED: '반려', REVERSED: '보상 회수' };

export const CAPABILITY_LABEL: Record<string, string> = { LIVE: '운영 중', READY: '준비됨', DEMO: '시연', NEXT: '개발 예정', BLOCKED: '막힘' };
export const capabilityLabel = (c: string) => CAPABILITY_LABEL[c] ?? c;

export const EVIDENCE_LABEL: Record<string, string> = { VERIFIED: '운영자 확인', USER_PROVIDED: '제공 정보', ASSUMPTION: '가정', UNKNOWN: '미확인' };

export const CONSENT_LABEL: Record<string, string> = {
  terms: '이용약관',
  privacy: '개인정보 수집·이용',
  age14: '만 14세 이상',
  marketing_inapp: '앱 안 혜택 알림',
  marketing_push: '푸시 알림',
  marketing_kakao: '카카오 알림',
};

const AUDIT_LABEL: Record<string, string> = {
  'campaign.create': '알림 초안 작성',
  'campaign.pause_toggle': '알림 중지/재개',
  'campaign.send': '알림 승인·발송',
  'cat.create': '고양이 추가',
  'cat.reorder': '고양이 순서 변경',
  'cat.update': '고양이 정보 수정',
  'checkin.confirm': '방문 확인',
  'checkin.reject': '방문 반려',
  'coupon.cancel': '쿠폰 취소',
  'coupon.redeem': '쿠폰 사용',
  'coupon.reissue': '쿠폰 재발급',
  'member.anonymize': '회원 정보 익명화',
  'member.deletion_request': '탈퇴 요청',
  'menu.update': '메뉴 수정',
  'photo.reorder': '사진 순서 변경',
  'photo.set_cover': '대표 사진 지정',
  'photo.upload': '사진 올림',
  'photo.published': '사진 공개',
  'photo.hidden': '사진 숨김',
  'purchase.confirm': '구매 확인',
  'purchase.reject': '구매 반려',
  'purchase.staff_create': '카운터 구매 등록',
  'reorder.approve': '재구매 안내 승인',
  'reorder.dismiss': '재구매 안내 보류',
  'rule.update': '혜택 규칙 수정',
  'store.update': '매장 정보 수정',
  'use.reverse': '이용 취소(환불)',
  signup: '회원가입',
  login: '로그인',
  consent: '동의 변경',
};
export const auditLabel = (a: string) => AUDIT_LABEL[a] ?? '기타 변경';

/** 감사 기록 대상: 내부 ID 대신 종류만 */
export function targetLabel(target: string) {
  const p = target.split('_')[0];
  return ({ chk: '방문 요청', ver: '구매 요청', cmp: '고객 알림', cpn: '쿠폰', usr: '회원', pho: '사진', cat: '고양이', m: '메뉴', store: '매장', rule: '혜택 규칙', rc: '재구매 후보', ref: '친구 추천' } as Record<string, string>)[p] ?? '항목';
}

/** 회원번호 — 내부 코드 'DC-1234' 를 화면에는 4자리 번호로 (카운터에서 부르기 쉽게) */
export const memberNo = (code: string | null | undefined) => (code ? code.replace(/^DC-/, '') : '');
