/**
 * 추가 확장 예정 — 출처: 「다색컴패니언 AX 프로그램 1차 개발 기획안」(김서윤 대표 제공, 2026-11)
 * 모든 항목은 아직 구현되지 않은 계획(NEXT)이다. 'now'에는 지금 앱에서 실제로 되는 것만 적는다.
 * 건강·정서·반려동물 건강 관련 항목은 진단·치료·수의학적 판단이 아님을 함께 적는다.
 * roadmapKey: 고객의 '관심 있어요'를 기존 로드맵 관심 집계(roadmapInterest)에 연결한다.
 */
export interface ExpansionItem {
  key: string;
  title: string;
  /** 도입되면 무엇이 되는가 (한두 줄) */
  plan: string;
  /** 지금 이 앱의 실제 상태 */
  now: string;
  /** 지금 앱에 이미 있는 기초 기능 (있을 때만) */
  base?: string;
  roadmapKey?: string;
}

export interface ExpansionTrack {
  key: 'food' | 'pet';
  brand: string;
  title: string;
  emoji: string;
  summary: string;
  items: ExpansionItem[];
}

export const EXPANSION_SOURCE = '다색컴패니언 AX 프로그램 1차 개발 기획안 (김서윤 대표)';
export const EXPANSION_PURPOSE = '리얼식단과 다색냥을 기반으로 AI 맞춤형 웰니스 서비스를 구축하고, 구독·커머스 플랫폼으로 확장합니다.';
export const EXPANSION_GOAL = 'AI로 사람의 식생활·정서적 웰니스와 반려동물의 생활관리를 연결하는 통합 웰니스 플랫폼';

export const EXPANSION_TRACKS: ExpansionTrack[] = [
  {
    key: 'food',
    brand: '리얼식단',
    title: 'AI 푸드 웰니스',
    emoji: '🥗',
    summary: '건강목표·식습관에 맞춘 식단 추천과 정기구독',
    items: [
      {
        key: 'health_profile',
        title: '건강목표·알레르기·식습관 등록',
        plan: '개인 건강목표와 식습관, 알레르기 정보를 등록해 식단 추천의 기준으로 씁니다.',
        now: '지금은 이런 정보를 받지 않아요. 민감정보 동의·최소수집 설계 후 도입합니다.',
        roadmapKey: 'food_wellness',
      },
      {
        key: 'nutrition_log',
        title: '주문 메뉴 칼로리·영양성분 자동 기록',
        plan: '확인된 주문 메뉴의 칼로리·영양성분이 자동으로 기록됩니다.',
        now: '메뉴별 영양성분이 검증되기 전에는 숫자를 추정해 보여주지 않아요.',
        base: '직원이 확인한 구매 기록은 지금도 남아요 (DEMO)',
        roadmapKey: 'food_wellness',
      },
      {
        key: 'diet_reco',
        title: '개인·가족 맞춤 식단 추천',
        plan: '목표와 식습관에 맞춘 개인 식단과 가족 식단을 추천합니다.',
        now: '지금은 저장·구매 기록 기반 규칙 추천만 있어요 (AI 모델 아님, ‘왜?’로 이유 표시).',
        base: '규칙 기반 메뉴 추천 동작 중 (DEMO)',
        roadmapKey: 'food_wellness',
      },
      {
        key: 'fridge_recipe',
        title: '냉장고 식재료 기반 레시피 추천',
        plan: '집에 있는 식재료를 고르면 만들 수 있는 레시피를 제안합니다.',
        now: '아직 제공하지 않아요. 레시피 콘텐츠 권리 확보 후 도입합니다.',
        roadmapKey: 'fridge_recipe',
      },
      {
        key: 'ingredient_link',
        title: '식재료 구매처 링크 연동',
        plan: '부족한 식재료를 구매처 링크로 바로 연결합니다.',
        now: '아직 제휴처가 정해지지 않았어요.',
        roadmapKey: 'partner_commerce',
      },
      {
        key: 'diet_subscription',
        title: '맞춤 식단 정기구독·주문 연계',
        plan: '맞춤 식단을 정기구독·주문으로 이어 받습니다.',
        now: '지금은 결제·자동결제를 받지 않아요. 결제·환불 정책 확정 후 도입합니다.',
        roadmapKey: 'subscription_pickup',
      },
    ],
  },
  {
    key: 'pet',
    brand: '다색냥',
    title: 'AI 멘탈·펫 웰니스',
    emoji: '🐈',
    summary: '쉼 프로그램 추천과 고양이 성향·생활관리',
    items: [
      {
        key: 'rest_program',
        title: '기분·스트레스 자가평가 기반 휴식 프로그램 추천',
        plan: '고객이 스스로 고른 기분·스트레스 정도에 맞춰 휴식 프로그램을 추천합니다.',
        now: '아직 제공하지 않아요. 진단·치료가 아닌 비의료 휴식 추천으로 설계합니다.',
        roadmapKey: 'rest_wellness',
      },
      {
        key: 'cat_records',
        title: '고양이별 성향·행동·건강정보 등록·관리',
        plan: '고양이마다 성향·행동·건강정보를 기록하고 관리합니다.',
        now: '건강정보는 아직 기록하지 않고, 고객에게 공개하지 않아요.',
        base: '고양이 프로필·성향 태그·사진 관리는 운영 AX에서 지금 동작 (DEMO)',
        roadmapKey: 'cat_companion',
      },
      {
        key: 'cat_personality',
        title: '데이터 기반 고양이 성향 분석',
        plan: '쌓인 기록으로 고양이별 성향을 분석해 손님 안내·교감 수칙에 활용합니다.',
        now: '지금은 직원이 적은 성향 태그만 보여줘요 (분석 기능 없음).',
        roadmapKey: 'cat_companion',
      },
      {
        key: 'cat_goods',
        title: '반려묘 맞춤 놀이·사료·용품 추천과 구매 링크',
        plan: '반려묘에 맞는 놀이·사료·용품을 추천하고 구매처로 연결합니다.',
        now: '아직 제공하지 않아요. 수의학적 판단·처방이 아닌 생활 정보로 설계합니다.',
        roadmapKey: 'cat_goods',
      },
    ],
  },
];

/** 개발 방향 — 기획안 원문 + 지금 상태 */
export const EXPANSION_STEPS: { title: string; now: string }[] = [
  { title: '모바일 웹 기반으로 구축', now: '지금 이 앱 (DEMO)' },
  { title: '기존 AI API를 활용한 맞춤 추천', now: '예정 — 지금은 규칙 기반 추천' },
  { title: '실제 매장 고객 대상 시범 운영', now: '예정 — 운영 데이터 연결 후' },
  { title: '구독·결제·외부 서비스 연동 단계적 확대', now: '예정' },
];

export const EXPANSION_COUNT = EXPANSION_TRACKS.reduce((n, t) => n + t.items.length, 0);
