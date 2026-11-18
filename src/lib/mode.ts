/**
 * 데이터 모드 — 지금은 항상 DEMO. 운영 전환 시 NEXT_PUBLIC_DATA_MODE=live 로 빌드한다.
 * LIVE 에서는 고객 화면에서 운영 AX 로 가는 '시연용' 진입점을 모두 숨기고,
 * 운영 AX 접근은 인증된 직원·관리자에게만 열어야 한다 (docs/LIVE_TRANSITION_CHECKLIST.md).
 */
export const DATA_MODE: 'demo' | 'live' = process.env.NEXT_PUBLIC_DATA_MODE === 'live' ? 'live' : 'demo';
export const IS_DEMO = DATA_MODE === 'demo';
/** 고객 화면에 '시연용 AX 보기'를 보여도 되는가 — DEMO 에서만 */
export const SHOW_DEMO_AX_ENTRY = IS_DEMO;
