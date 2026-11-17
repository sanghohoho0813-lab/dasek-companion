import type { Role } from './types';

/**
 * 역할별 권한 (DEMO에서는 앱 계층에서 강제, LIVE에서는 Supabase RLS로 동일 규칙을 강제)
 * supabase/migrations/0002_rls.sql 와 1:1 대응한다.
 */
export type Permission =
  | 'queue.verify' // 방문·구매 확인/반려
  | 'purchase.create' // 직원이 카운터에서 구매 확인 등록
  | 'coupon.redeem'
  | 'coupon.cancel'
  | 'member.view'
  | 'member.viewContact' // 연락처 일부(뒤 4자리) 보기
  | 'member.process_deletion'
  | 'verification.reverse' // 환불·취소에 따른 확인 취소
  | 'rules.edit'
  | 'content.edit'
  | 'photo.approve'
  | 'campaign.create'
  | 'campaign.approve'
  | 'reorder.approve'
  | 'settings.store'
  | 'evidence.view';

const MATRIX: Record<Exclude<Role, 'customer'>, Permission[]> = {
  staff: ['queue.verify', 'purchase.create', 'coupon.redeem', 'member.view', 'evidence.view', 'campaign.create'],
  manager: [
    'queue.verify',
    'purchase.create',
    'coupon.redeem',
    'coupon.cancel',
    'member.view',
    'member.viewContact',
    'member.process_deletion',
    'verification.reverse',
    'rules.edit',
    'content.edit',
    'photo.approve',
    'campaign.create',
    'campaign.approve',
    'reorder.approve',
    'settings.store',
    'evidence.view',
  ],
};

export function can(role: Role | 'system', p: Permission): boolean {
  if (role === 'system') return true;
  if (role === 'customer') return false;
  return MATRIX[role].includes(p);
}

export const PERMISSION_LABEL: Record<Permission, string> = {
  'queue.verify': '방문·구매 확인/반려',
  'purchase.create': '카운터 구매 확인 등록',
  'coupon.redeem': '쿠폰 사용 처리',
  'coupon.cancel': '쿠폰 취소(감사 기록)',
  'member.view': '회원 조회',
  'member.viewContact': '연락처 뒤 4자리 보기',
  'member.process_deletion': '탈퇴·삭제 요청 처리',
  'verification.reverse': '환불에 따른 확인 취소',
  'rules.edit': '혜택 규칙 변경',
  'content.edit': '메뉴·고양이 콘텐츠 수정',
  'photo.approve': '사진 공개 승인',
  'campaign.create': '캠페인 초안 작성',
  'campaign.approve': '캠페인 승인·발송',
  'reorder.approve': '재구매 안내 승인',
  'settings.store': '매장 정보·권리상태 수정',
  'evidence.view': '실증·성과 조회',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABEL) as Permission[];

export class PermissionError extends Error {
  constructor(public permission: Permission) {
    super(`권한이 없습니다: ${PERMISSION_LABEL[permission]}`);
  }
}

export function assertCan(role: Role | 'system', p: Permission) {
  if (!can(role, p)) throw new PermissionError(p);
}
