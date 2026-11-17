import { BackHeader } from '@/components/customer/Shell';

export const metadata = { title: '개인정보 처리 안내(초안)' };

export default function PrivacyPage() {
  return (
    <div>
      <BackHeader title="개인정보 처리 안내" />
      <article className="mx-auto max-w-2xl px-5 pb-10 pt-6 text-[14px] leading-relaxed text-ink-2 md:pt-10">
        <h1 className="text-[24px] font-extrabold text-ink">개인정보 처리 안내 (초안)</h1>
        <p className="mt-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900">이 문서는 개발용 초안입니다. 사업자 정보·처리 주체·위탁 현황 확인과 법률 검토 후 확정됩니다.</p>
        <h2 className="mt-6 text-[16px] font-bold text-ink">수집 항목과 목적</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>이름(닉네임): 회원 식별, 매장 응대</li>
          <li>휴대폰 번호(선택): 중복 가입 방지 — 원본 대신 해시값과 뒤 4자리만 저장</li>
          <li>이용 기록(체크인·구매 확인·쿠폰): 혜택 지급, 부정 이용 방지</li>
          <li>관심 기록(저장 메뉴·조회): 맞춤 안내 (마케팅 수신 동의자에 한해 안내 발송)</li>
        </ul>
        <h2 className="mt-6 text-[16px] font-bold text-ink">수집하지 않는 정보</h2>
        <p className="mt-2">1차 서비스에서는 건강·알레르기·정서 상태·반려동물 건강 정보를 수집하지 않습니다.</p>
        <h2 className="mt-6 text-[16px] font-bold text-ink">마케팅 수신</h2>
        <p className="mt-2">목적별(앱 안 알림·푸시·카카오)로 따로 동의를 받고 버전과 시각을 기록합니다. 언제든 마이 &gt; 동의 설정에서 철회할 수 있습니다.</p>
        <h2 className="mt-6 text-[16px] font-bold text-ink">보관과 삭제</h2>
        <p className="mt-2">탈퇴 요청 시 운영자 확인 후 개인정보를 익명화합니다. 법령상 보관이 필요한 거래 기록은 해당 기간 동안 분리 보관합니다(기준 확정 예정).</p>
      </article>
    </div>
  );
}
