/**
 * 향후 확장(Future 30%) — 현재 구현되지 않은 서비스. 모든 항목은 NEXT(준비 중)로만 표시한다.
 * 진단·치료·수의학적 판단·결제 기능처럼 보이는 표현을 쓰지 않는다.
 */
export interface RoadmapItem {
  key: string;
  group: string;
  emoji: string;
  title: string;
  oneLine: string;
  what: string[];
  notNow: string[];
  prerequisites: string[];
}

export const ROADMAP: RoadmapItem[] = [
  {
    key: 'subscription_pickup',
    group: '정기구독',
    emoji: '🥗',
    title: '주간 샐러드 정기픽업',
    oneLine: '요일을 정해 두면 매장에서 바로 픽업하는 정기 식단 — 수요 확인 중',
    what: ['원하는 요일·메뉴를 미리 정해 두는 정기픽업', '픽업 알림과 일시정지·건너뛰기', '유료 멤버십·방문 패스와 연계 검토'],
    notNow: ['결제·자동결제는 지금 제공하지 않아요', '정기배송은 원가·물류 확인 후 검토해요'],
    prerequisites: ['리얼식단 가맹 정책·메뉴 권리 확인', '결제·환불 정책', '픽업 운영 동선'],
  },
  {
    key: 'food_wellness',
    group: 'AI 푸드 웰니스',
    emoji: '🍽️',
    title: '나에게 맞는 식단 기록',
    oneLine: '건강 목표·식습관에 맞춘 메뉴 기록 — 검증된 영양정보 확보 후',
    what: ['선택한 목표에 맞는 메뉴 모아보기', '검증된 영양성분이 있는 메뉴만 자동 기록', '가족 식단·식재료 기반 레시피(검토)'],
    notNow: ['칼로리·영양성분을 추정해 보여주지 않아요', '알레르기 안전을 보장하지 않아요', '의학적 진단·처방이 아니에요'],
    prerequisites: ['메뉴별 원재료·중량·영양성분 검증', '민감정보 동의·최소수집 설계'],
  },
  {
    key: 'cat_companion',
    group: '반려묘 컴패니언',
    emoji: '🐈',
    title: '우리 집 고양이 기록',
    oneLine: '내 반려묘의 성향·놀이·용품 기록 — 매장 고양이 정보와 분리',
    what: ['내 반려묘 프로필과 행동 관찰 메모', '놀이·용품 정보 모아보기', '외부 구매 링크(제휴 확인 후)'],
    notNow: ['수의학적 판단·건강 진단을 하지 않아요', '매장 고양이의 내부 건강 기록은 공개하지 않아요'],
    prerequisites: ['고객 반려묘 데이터 동의', '제휴 정책'],
  },
  {
    key: 'rest_wellness',
    group: '휴식·정서 웰니스',
    emoji: '🌿',
    title: '오늘의 쉼 추천',
    oneLine: '스스로 고른 기분에 맞춘 산책길·휴식 콘텐츠 — 비의료 서비스',
    what: ['직접 선택한 기분에 맞는 휴식 콘텐츠', '향동천 산책 코스와 방문 연결'],
    notNow: ['정신건강 진단·치료 표현을 쓰지 않아요', '기분 기록을 자동 수집하지 않아요'],
    prerequisites: ['콘텐츠 운영 주체', '민감정보 최소수집 정책'],
  },
  {
    key: 'b2b_office',
    group: 'B2B·커머스',
    emoji: '🏢',
    title: '사무실 단체 식단',
    oneLine: '주변 기업·사무실 단체 주문과 정기픽업 — 수요 확인 중',
    what: ['단체 주문 문의와 정기 납품 상담', '제휴 식재료·펫용품 커머스 검토'],
    notNow: ['단체 주문 접수·결제는 아직 받지 않아요'],
    prerequisites: ['생산 용량·원가', '가맹본부 정책'],
  },
  {
    key: 'partner_saas',
    group: '외부 사업자 플랫폼',
    emoji: '🤝',
    title: '다른 매장을 위한 멤버십 운영 도구',
    oneLine: '충분한 실증 뒤 다른 사업자에게 멤버십·고객관리를 제공 — 장기 검토',
    what: ['다점포·독립 브랜드 지원 구조', '매장별 데이터 분리와 권한 관리'],
    notNow: ['리얼식단 타 점포와의 제휴는 확정되지 않았어요', '현재는 이 매장 실증에 집중해요'],
    prerequisites: ['12주 실증 결과', '가맹본부 승인', '정산·테넌트 관리'],
  },
];
