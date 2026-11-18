/**
 * 사업 단계 — 지금(DEMO) / 다음(실제 매장 운영) / 이후(유료 웰니스 사업)
 * 없는 기능을 있는 것처럼 쓰지 않는다. '왜 지금 데이터와 이어지는가'를 한 줄로.
 */
export interface StageItem {
  title: string;
  /** 지금 쌓이는 어떤 데이터·구조 위에서 가능한가 */
  link?: string;
}
export interface Stage {
  key: 'now' | 'next' | 'later';
  label: string;
  status: string;
  summary: string;
  items: StageItem[];
}

export const STAGES: Stage[] = [
  {
    key: 'now',
    label: '지금 — DEMO',
    status: '동작함 · 이 브라우저 안에서',
    summary: '고객 앱과 매장 운영 AX 가 같은 규칙·데이터로 이어지는 것을 확인할 수 있어요.',
    items: [
      { title: '메뉴·고양이 탐색 (실제 고양이 14마리)' },
      { title: '회원가입·친구 추천 시연' },
      { title: '쿠폰·스탬프·추천 보상 규칙 (중복 지급 방지)' },
      { title: '방문·구매 직원 확인' },
      { title: '앱 안 고객 알림 (책임자 승인 후 발송)' },
      { title: '고객 행동·성과 기록 (근거 수준 구분)' },
      { title: '운영 AX (PC·모바일·7개 테마)' },
      { title: '확장 서비스 관심 등록' },
    ],
  },
  {
    key: 'next',
    label: '다음 — 실제 매장 운영',
    status: '개발 필요 · 파일럿 전',
    summary: '직원 여러 명이 각자 기기에서 같은 데이터를 쓰려면 서버가 필요해요.',
    items: [
      { title: '공통 데이터베이스 (지금은 브라우저 저장)' },
      { title: '실제 회원 로그인·본인 확인' },
      { title: '서버에서 지키는 직원·책임자 권한' },
      { title: '쿠폰·보상의 서버 처리 (위변조 방지)' },
      { title: '실제 메뉴·가격·사진 등록' },
      { title: '개인정보 처리방침·보안 점검' },
      { title: '매장 1곳 파일럿 (2~12주)' },
    ],
  },
  {
    key: 'later',
    label: '이후 — 유료 웰니스 사업',
    status: '계획 · 아직 개발 전',
    summary: '파일럿에서 쌓인 확인 이용·관심 기록이 다음 사업의 근거가 돼요.',
    items: [
      { title: 'AI 개인 맞춤 식단·영양 기록', link: '확인 구매 기록 + 메뉴 영양정보 검증' },
      { title: '가족 식단', link: '회원별 저장·구매 기록' },
      { title: '냉장고 재료 레시피', link: '메뉴 재료 데이터 구조' },
      { title: '정기픽업·식단 구독 (결제)', link: '저장 메뉴·재방문 주기' },
      { title: '반려묘 생활관리', link: '고양이 프로필·성향 기록' },
      { title: '휴식·정서 웰니스 (비의료)', link: '방문 시간대·관심 등록' },
      { title: '제휴 상품·커머스', link: '관심 등록 수요 집계' },
      { title: '다른 매장용 AX·SaaS', link: '지금 운영 AX 구조 그대로' },
    ],
  },
];

/** 지금 없는 것 — 발표·문서에서 항상 같은 말로 */
export const NOT_YET = ['외부 AI API', '실제 결제', 'POS 연동', '카카오·푸시 발송', '서버 기반 다중 사용자 운영'];
