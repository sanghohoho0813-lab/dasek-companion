/**
 * 향후 확장(Future) — 현재 구현되지 않은 서비스. 모든 항목은 NEXT(개발 예정)로만 표시한다.
 * 진단·치료·수의학적 판단·결제 기능처럼 보이는 표현을 쓰지 않는다.
 * 고객에게는 5개 그룹으로 묶어 보여주고, 관심 등록은 roadmapInterest(itemKey)로 운영 AX에 집계된다.
 * ⚠ 기존 key(subscription_pickup, food_wellness, cat_companion, rest_wellness, b2b_office, partner_saas)는 데이터 호환을 위해 유지.
 */
export interface RoadmapItem {
  key: string;
  group: RoadmapGroupKey;
  emoji: string;
  title: string;
  oneLine: string;
  what: string[];
  notNow: string[];
  prerequisites: string[];
}

export type RoadmapGroupKey = 'food' | 'subscription' | 'rest' | 'pet' | 'partner';

export const ROADMAP_GROUPS: { key: RoadmapGroupKey; emoji: string; title: string; desc: string }[] = [
  { key: 'food', emoji: '🥗', title: '식생활 웰니스', desc: '나와 가족에게 맞는 식단·레시피' },
  { key: 'subscription', emoji: '📦', title: '정기 구독', desc: '정기픽업·정기배송·유료 멤버십' },
  { key: 'rest', emoji: '🌿', title: '휴식·정서', desc: '산책길과 이어지는 쉼 콘텐츠' },
  { key: 'pet', emoji: '🐈', title: '반려생활', desc: '우리 집 고양이 기록과 용품' },
  { key: 'partner', emoji: '🤝', title: '제휴·기업', desc: '제휴 커머스·단체식단·사업자 도구' },
];

export const ROADMAP: RoadmapItem[] = [
  {
    key: 'food_wellness',
    group: 'food',
    emoji: '🍽️',
    title: 'AI 맞춤 식단 · 가족 식단',
    oneLine: '건강 목표·식습관에 맞춘 메뉴 모음과 가족 식단 — 검증된 영양정보 확보 후',
    what: ['선택한 목표에 맞는 메뉴 모아보기', '검증된 영양성분이 있는 메뉴만 자동 기록', '가족 구성에 맞춘 주간 식단 제안'],
    notNow: ['칼로리·영양성분을 추정해 보여주지 않아요', '알레르기 안전을 보장하지 않아요', '의학적 진단·처방이 아니에요'],
    prerequisites: ['메뉴별 원재료·중량·영양성분 검증', '민감정보 동의·최소수집 설계'],
  },
  {
    key: 'fridge_recipe',
    group: 'food',
    emoji: '🧊',
    title: '냉장고 재료 레시피',
    oneLine: '집에 있는 재료로 만들 수 있는 가벼운 레시피 제안',
    what: ['가진 재료를 고르면 레시피 추천', '부족한 재료는 제휴 구매 링크(검토)'],
    notNow: ['식재료 사진 인식은 하지 않아요', '건강 효과를 주장하지 않아요'],
    prerequisites: ['레시피 콘텐츠 권리', '재료 데이터 구조'],
  },
  {
    key: 'subscription_pickup',
    group: 'subscription',
    emoji: '🥗',
    title: '샐러드 정기픽업 · 정기배송',
    oneLine: '요일을 정해 두면 매장에서 바로 픽업 — 수요 확인 중',
    what: ['원하는 요일·메뉴를 미리 정해 두는 정기픽업', '픽업 알림과 일시정지·건너뛰기', '정기배송은 원가·물류 확인 후 검토'],
    notNow: ['결제·자동결제는 지금 제공하지 않아요', '배송 지역·요금은 정해지지 않았어요'],
    prerequisites: ['리얼식단 가맹 정책·메뉴 권리 확인', '결제·환불 정책', '픽업 운영 동선'],
  },
  {
    key: 'paid_membership',
    group: 'subscription',
    emoji: '💳',
    title: '유료 멤버십 · 방문 패스',
    oneLine: '자주 오는 분을 위한 월간 혜택 패스 — 아이디어 검증 중',
    what: ['월 단위 방문 패스', '음료·디저트 정기 혜택', '멤버 전용 이벤트'],
    notNow: ['지금은 결제를 받지 않아요', '가격·혜택은 정해지지 않았어요'],
    prerequisites: ['이용요금 정책', '결제·환불·약관', '재방문 데이터 12주'],
  },
  {
    key: 'rest_wellness',
    group: 'rest',
    emoji: '🌿',
    title: '오늘의 쉼 추천',
    oneLine: '스스로 고른 기분에 맞춘 산책길·휴식 콘텐츠 — 비의료 서비스',
    what: ['직접 선택한 기분에 맞는 휴식 콘텐츠', '향동천 산책 코스와 방문 연결'],
    notNow: ['정신건강 진단·치료 표현을 쓰지 않아요', '기분 기록을 자동 수집하지 않아요'],
    prerequisites: ['콘텐츠 운영 주체', '민감정보 최소수집 정책'],
  },
  {
    key: 'cat_companion',
    group: 'pet',
    emoji: '🐈',
    title: '우리 집 고양이 기록',
    oneLine: '내 반려묘의 성향·생활 기록 — 매장 고양이 정보와 분리',
    what: ['내 반려묘 프로필과 행동 관찰 메모', '생활 루틴(놀이·식사 시간) 기록'],
    notNow: ['수의학적 판단·건강 진단을 하지 않아요', '매장 고양이의 내부 건강 기록은 공개하지 않아요'],
    prerequisites: ['고객 반려묘 데이터 동의', '데이터 보관 정책'],
  },
  {
    key: 'cat_goods',
    group: 'pet',
    emoji: '🧶',
    title: '놀이·사료·용품 추천',
    oneLine: '반려묘 성향에 맞는 놀이와 용품 정보 — 제휴 확인 후',
    what: ['성향별 놀이 방법 안내', '사료·용품 정보와 외부 구매 링크'],
    notNow: ['처방식·치료용 제품을 추천하지 않아요', '제휴는 아직 확정되지 않았어요'],
    prerequisites: ['제휴 정책', '광고 표기 기준'],
  },
  {
    key: 'partner_commerce',
    group: 'partner',
    emoji: '🛒',
    title: '식재료·펫용품 제휴 커머스',
    oneLine: '믿을 수 있는 식재료와 펫용품을 제휴로 소개 — 장기 검토',
    what: ['제휴 상품 소개와 외부 구매 연결', '멤버 혜택 연계'],
    notNow: ['앱 안 결제·배송은 하지 않아요'],
    prerequisites: ['제휴 계약', '정산·반품 정책'],
  },
  {
    key: 'b2b_office',
    group: 'partner',
    emoji: '🏢',
    title: '사무실 단체 식단',
    oneLine: '주변 기업·사무실 단체 주문과 정기픽업 — 수요 확인 중',
    what: ['단체 주문 문의와 정기 납품 상담', '제휴 매장·파트너 서비스 연결'],
    notNow: ['단체 주문 접수·결제는 아직 받지 않아요'],
    prerequisites: ['생산 용량·원가', '가맹본부 정책'],
  },
  {
    key: 'partner_saas',
    group: 'partner',
    emoji: '🧭',
    title: '다른 매장을 위한 운영 도구',
    oneLine: '충분한 실증 뒤 다른 사업자에게 멤버십·고객관리 AX 제공 — 장기',
    what: ['다점포·독립 브랜드 지원 구조', '매장별 데이터 분리와 권한 관리'],
    notNow: ['리얼식단 타 점포와의 제휴는 확정되지 않았어요', '현재는 이 매장 실증에 집중해요'],
    prerequisites: ['12주 실증 결과', '가맹본부 승인', '정산·테넌트 관리'],
  },
];
