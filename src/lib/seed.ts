/**
 * DEMO 시드 — 실제 고객·매출 데이터가 아니다.
 * 근거 표기: USER_PROVIDED = 사용자가 제공한 네이버 플레이스 공개정보(2026-11-17 확인)
 *            ASSUMPTION/UNKNOWN = 운영자 확인 전 가정·미확인
 * 시드 이력은 도메인 액션을 과거 시각으로 재생해 만들어 원장·쿠폰·Proof가 서로 일관된다.
 */
import * as D from './domain';
import type { AppState, ArtSpec, CafeCat, CatPhoto, FactField, LoyaltyRule, MenuItem, Store } from './types';
import { addDays, DAY, dailyCheckinCode, dayKey, mulberry32 } from './util';

export const SCHEMA_VERSION = 6;
const NAVER_SRC = '사용자 제공 네이버 플레이스 공개정보 (2026-11-17)';

const fact = <T = string>(value: NoInfer<T> | null, evidence: FactField['evidence'], source: string, checkedAt: string | null = null): FactField<T> => ({ value, evidence, source, checkedAt });

function baseState(nowIso: string): AppState {
  const stores: Store[] = [
    {
      id: 'store_dasek',
      brand: 'dasek',
      businessEntityId: 'be_dasek',
      name: '다색냥',
      tagline: '120겹파이와 함께하는 달콤한 휴식',
      address: fact('경기 고양시 덕양구 꽃내음1길 88 지층', 'USER_PROVIDED', NAVER_SRC, '2026-11-17'),
      directions: fact('향동천 산책길에 위치', 'USER_PROVIDED', NAVER_SRC, '2026-11-17'),
      hours: fact('21:00 영업 종료 (요일별 시작 시간·휴무일 확인 필요)', 'USER_PROVIDED', `${NAVER_SRC} — 전체 시간표 미확인`, '2026-11-17'),
      phone: fact('0507-1370-5404', 'USER_PROVIDED', `${NAVER_SRC} — 네이버 연결번호일 수 있음`, '2026-11-17'),
      placeUrl: fact('https://m.place.naver.com/restaurant/2069040566/home', 'USER_PROVIDED', NAVER_SRC, '2026-11-17'),
      reservationUrl: fact('https://m.place.naver.com/restaurant/2069040566/booking', 'USER_PROVIDED', `${NAVER_SRC} — 네이버 예약 메뉴 존재, 운영 여부 확인 필요`, '2026-11-17'),
      orderUrl: fact(null, 'UNKNOWN', '데스크 주문 운영(공개 리뷰 요약) — 온라인 주문 채널 미확인'),
      deliveryUrl: fact(null, 'UNKNOWN', '배달 운영(사용자 설명) — 채널·링크 미확인'),
      instagramUrl: fact('https://www.instagram.com/dasek_nyang', 'USER_PROVIDED', NAVER_SRC, '2026-11-17'),
      feeInfo: fact(null, 'UNKNOWN', '고양이카페 이용요금·기본 음료 포함 여부 미확인'),
      amenities: fact(['포장', '남/녀 화장실 구분', '무선 인터넷', '간편결제'], 'USER_PROVIDED', NAVER_SRC, '2026-11-17'),
      status: 'DEMO',
    },
    {
      id: 'store_realsicdan',
      brand: 'realsicdan',
      businessEntityId: 'be_realsicdan',
      name: '리얼식단',
      tagline: '가볍고 든든한 하루 한 끼',
      address: fact('경기 고양시 덕양구 꽃내음1길 88 지층 (다색냥 매장 내 판매로 가정)', 'ASSUMPTION', '사용자 설명: 같은 매장에서 식단 메뉴 판매 — 별도 점포 여부 확인 필요'),
      directions: fact('향동천 산책길, 다색냥 매장 내', 'ASSUMPTION', '동일 매장 가정'),
      hours: fact(null, 'UNKNOWN', '운영자 확인 필요'),
      phone: fact(null, 'UNKNOWN', '운영자 확인 필요'),
      placeUrl: fact(null, 'UNKNOWN', '운영자 확인 필요'),
      reservationUrl: fact(null, 'UNKNOWN', '해당 없음 가능'),
      orderUrl: fact(null, 'UNKNOWN', '외부 주문 채널·가맹본부 정책 확인 필요'),
      deliveryUrl: fact(null, 'UNKNOWN', '배달 운영(사용자 설명) — 플랫폼·링크 미확인'),
      instagramUrl: fact(null, 'UNKNOWN', '운영자 확인 필요'),
      feeInfo: fact(null, 'UNKNOWN', '해당 없음'),
      amenities: fact(null, 'UNKNOWN', '운영자 확인 필요'),
      status: 'DEMO',
    },
  ];

  const rules: LoyaltyRule[] = [
    { id: 'rule_signup', kind: 'SIGNUP', title: '첫 가입 웰컴 쿠폰', benefit: '디저트 1,000원 할인', stampsRequired: null, validDays: 30, active: true, qualifyingEvent: 'CONFIRMED_PURCHASE_OR_VISIT', updatedAt: nowIso, updatedBy: null, evidence: 'ASSUMPTION' },
    { id: 'rule_stamp', kind: 'STAMP', title: '스탬프 10개 보상', benefit: '음료 또는 디저트 1개 무료', stampsRequired: 10, validDays: 60, active: true, qualifyingEvent: 'CONFIRMED_PURCHASE_OR_VISIT', updatedAt: nowIso, updatedBy: null, evidence: 'ASSUMPTION' },
    { id: 'rule_ref_referrer', kind: 'REFERRAL_REFERRER', title: '친구 추천 보상', benefit: '120겹파이 1개 무료', stampsRequired: null, validDays: 60, active: true, qualifyingEvent: 'CONFIRMED_PURCHASE_OR_VISIT', updatedAt: nowIso, updatedBy: null, evidence: 'ASSUMPTION' },
    { id: 'rule_ref_referee', kind: 'REFERRAL_REFEREE', title: '추천 가입 웰컴', benefit: '첫 이용 1,000원 추가 할인', stampsRequired: null, validDays: 30, active: true, qualifyingEvent: 'CONFIRMED_PURCHASE_OR_VISIT', updatedAt: nowIso, updatedBy: null, evidence: 'ASSUMPTION' },
  ];

  const mi = (p: Partial<MenuItem> & Pick<MenuItem, 'id' | 'brand' | 'categoryId' | 'name' | 'summary' | 'art'>, order: number): MenuItem => ({
    storeId: p.brand === 'dasek' ? 'store_dasek' : 'store_realsicdan',
    description: '',
    price: null,
    priceEvidence: 'UNKNOWN',
    tags: [],
    photoSlot: null,
    photoDataUrl: null,
    nutritionStatus: 'UNVERIFIED',
    nutrition: null,
    allergenStatus: 'UNKNOWN',
    allergens: [],
    published: true,
    isSignature: false,
    evidence: 'ASSUMPTION',
    source: 'DEMO 예시 메뉴 — 실제 판매 여부 확인 필요',
    isDemo: true,
    sortOrder: order,
    ...p,
  });
  const realReview = '공개 리뷰 요약에 언급된 메뉴 (사용자 제공, 2026-11-17)';
  const menuItems: MenuItem[] = [
    mi({ id: 'm_chicken_salad', brand: 'realsicdan', categoryId: 'rs_salad', name: '닭가슴살 샐러드', summary: '든든한 단백질 한 그릇', description: '매장에서 판매 중인 것으로 확인된 메뉴입니다. 구성과 가격은 매장에서 확인해 주세요.', tags: ['단백질', '샐러드', '가벼운 한 끼'], art: { kind: 'salad', variant: 0 }, photoSlot: 'offer_01_salad', evidence: 'USER_PROVIDED', source: realReview, isDemo: false }, 0),
    mi({ id: 'm_diet_box', brand: 'realsicdan', categoryId: 'rs_box', name: '다이어트 도시락', summary: '식단 관리용 도시락', description: '매장에서 판매 중인 것으로 확인된 메뉴입니다. 구성과 가격은 매장에서 확인해 주세요.', tags: ['도시락', '식단', '든든한 한 끼'], art: { kind: 'lunchbox', variant: 0 }, evidence: 'USER_PROVIDED', source: realReview, isDemo: false }, 1),
    mi({ id: 'm_salmon_poke', brand: 'realsicdan', categoryId: 'rs_salad', name: '가든 콘 샐러드', summary: '옥수수·방울토마토·당근을 듬뿍', description: 'DEMO 예시 메뉴입니다. 실제 판매 메뉴로 교체해 주세요.', price: 8900, priceEvidence: 'ASSUMPTION', tags: ['샐러드', '채소 듬뿍', '가벼운 한 끼'], art: { kind: 'salad', variant: 1 } }, 2),
    mi({ id: 'm_fruit_salad', brand: 'realsicdan', categoryId: 'rs_salad', name: '치즈 그린 샐러드', summary: '부드러운 치즈와 올리브, 잎채소', description: 'DEMO 예시 메뉴입니다.', price: 9500, priceEvidence: 'ASSUMPTION', tags: ['샐러드', '치즈', '상큼한'], art: { kind: 'salad', variant: 2 } }, 3),
    mi({ id: 'm_sweetpotato_box', brand: 'realsicdan', categoryId: 'rs_box', name: '브레드 샐러드 박스', summary: '잎채소 샐러드와 곡물빵 한 상자', description: 'DEMO 예시 메뉴입니다.', price: 8500, priceEvidence: 'ASSUMPTION', tags: ['도시락', '든든한 한 끼', '포장 가능'], art: { kind: 'lunchbox', variant: 1 } }, 4),
    mi({ id: 'm_greek_bowl', brand: 'realsicdan', categoryId: 'rs_snack', name: '그릭요거트 볼', summary: '그래놀라·딸기·망고 토핑', description: 'DEMO 예시 메뉴입니다.', price: 5500, priceEvidence: 'ASSUMPTION', tags: ['간식', '단백질', '상큼한'], art: { kind: 'snack', variant: 0 } }, 5),
    mi({ id: 'm_pie120', brand: 'dasek', categoryId: 'dn_dessert', name: '120겹파이', summary: '겹겹이 바삭한 다색냥 대표 디저트', description: '다색냥의 대표 메뉴입니다. 가격은 공개 메뉴 정보 기준이며 매장 사정에 따라 달라질 수 있어요.', price: 4500, priceEvidence: 'USER_PROVIDED', tags: ['디저트', '대표', '포장 가능'], art: { kind: 'pie', variant: 0 }, photoSlot: 'offer_03_dessert', isSignature: true, evidence: 'USER_PROVIDED', source: `${NAVER_SRC} — 대표 메뉴 4,500원`, isDemo: false }, 0),
    mi({ id: 'm_machine_drink', brand: 'dasek', categoryId: 'dn_drink', name: '기본 음료 (머신)', summary: '기계로 제공되는 기본 음료', description: '기본 음료는 기계로 제공된다고 안내되어 있어요. 이용요금 포함 여부는 매장에서 확인해 주세요.', tags: ['음료'], art: { kind: 'drink', variant: 0 }, photoSlot: 'offer_02_drink', evidence: 'USER_PROVIDED', source: realReview, isDemo: false }, 1),
    mi({ id: 'm_lemonade', brand: 'dasek', categoryId: 'dn_drink', name: '수제 레몬에이드', summary: '데스크 주문 음료 예시', description: 'DEMO 예시 메뉴입니다. 데스크 주문 메뉴로 교체해 주세요.', price: 5500, priceEvidence: 'ASSUMPTION', tags: ['음료', '상큼한'], art: { kind: 'drink', variant: 1 } }, 2),
    mi({ id: 'm_milktea', brand: 'dasek', categoryId: 'dn_drink', name: '밀크티 라떼', summary: '부드러운 홍차 라떼 (데스크 주문 예시)', description: 'DEMO 예시 메뉴입니다.', price: 5000, priceEvidence: 'ASSUMPTION', tags: ['음료', '따뜻한'], art: { kind: 'drink', variant: 2 } }, 3),
    mi({ id: 'm_cat_cookie', brand: 'dasek', categoryId: 'dn_dessert', name: '초코칩 쿠키', summary: '포장해 가기 좋은 간식', description: 'DEMO 예시 메뉴입니다. 사람이 먹는 간식이에요 — 고양이에게 주지 마세요.', price: 3000, priceEvidence: 'ASSUMPTION', tags: ['디저트', '포장 가능'], art: { kind: 'snack', variant: 1 } }, 4),
  ];

  const catDefs: CatDef[] = [
    ['cat_1', '모카', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'green', pose: 'sit', bg: 0 }, ['느긋함', '창가 담당'], ['햇볕 쬐기', '깃털 장난감']],
    ['cat_2', '보리', { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'loaf', bg: 1 }, ['애교 많음', '사람 좋아함'], ['턱 쓰다듬기', '공 굴리기']],
    ['cat_3', '구름', { kind: 'cat', coat: 'white', pattern: 'solid', eyes: 'blue', pose: 'sit', bg: 2 }, ['조용함', '관찰형'], ['높은 곳', '낚싯대 장난감']],
    ['cat_4', '콩떡', { kind: 'cat', coat: 'black', pattern: 'tuxedo', eyes: 'amber', pose: 'peek', bg: 3 }, ['호기심 왕', '장난꾸러기'], ['상자 탐험', '레이저 놀이 대신 깃털']],
    ['cat_5', '단풍', { kind: 'cat', coat: 'white', pattern: 'calico', eyes: 'copper', pose: 'loaf', bg: 4 }, ['도도함', '낮잠 장인'], ['담요', '조용한 손님']],
    ['cat_6', '라떼', { kind: 'cat', coat: 'cream', pattern: 'point', eyes: 'blue', pose: 'sleep', bg: 0 }, ['순둥이', '무릎 고양이'], ['쓰다듬기', '간식 시간']],
    ...EXTRA_CATS,
  ];
  const tips = ['자고 있을 때는 깨우지 않아요', '억지로 안아 올리지 않아요', '간식은 직원 안내에 따라 주세요', '플래시 없이 촬영해 주세요'];
  const cats: CafeCat[] = catDefs.map(([id, name, art, personality, likes], i) => ({
    id,
    name,
    isPlaceholder: true,
    tagline: ['창가 자리를 지키는 느긋한 형님', '먼저 다가와 인사하는 애교쟁이', '높은 곳에서 손님을 관찰해요', '상자만 보면 들어가는 탐험가', '담요 위 낮잠이 하루 일과', '무릎 위가 제일 좋아요'][i] ?? EXTRA_TAGLINES[i - 6],
    personality,
    likes,
    interactionTips: tips,
    coverArt: art,
    published: true,
    sortOrder: i,
    internalNote: '예시 프로필 — 실제 고양이 이름·사진·건강정보 확인 후 교체',
  }));
  const poses = ['sit', 'loaf', 'peek', 'sleep'] as const;
  const captions = ['대표 사진', '가까이서 본 얼굴', '오늘의 한 컷', '쉬는 시간'];
  const catPhotos: CatPhoto[] = cats.flatMap((c, ci) =>
    // 기존 6마리: 사진 4장 · 추가 19마리: 대표 사진 1장 (샘플 사진 풀에서 서로 다른 고양이)
    (ci < 6 ? poses : poses.slice(0, 1)).map((pose, pi) => ({
      id: `pho_${c.id}_${pi}`,
      catId: c.id,
      art: pi === 0 ? c.coverArt : { ...(c.coverArt as ArtSpec & { kind: 'cat' }), pose, bg: (ci + pi + 1) % 5 },
      dataUrl: null,
      slot: `cat_${String(ci + 1).padStart(2, '0')}_${String(pi + 1).padStart(2, '0')}`,
      caption: pi === 0 ? c.tagline : captions[pi],
      alt: `${c.name}(예시 프로필) 샘플 사진 — ${captions[pi]}`,
      status: 'PUBLISHED',
      sortOrder: pi,
      uploadedBy: null,
      createdAt: nowIso,
    })),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    mode: 'DEMO',
    seededAt: nowIso,
    session: { customerId: null, operatorId: 'op_manager' },
    settings: { axTheme: 'pure-white', fontScale: 'md', customerOnboarded: false, axTutorialDone: false },
    businessEntities: [
      { id: 'be_realsicdan', brand: 'realsicdan', name: '리얼식단', description: '식단·샐러드 중심 브랜드', bizNumber: null, evidence: 'UNKNOWN', note: '가맹사업 여부·상표 사용 범위·사업자번호·매출 귀속 미확인' },
      { id: 'be_dasek', brand: 'dasek', name: '다색냥', description: '고양이카페·음료·디저트', bizNumber: null, evidence: 'UNKNOWN', note: '사업자번호·데이터 처리 주체 미확인' },
    ],
    stores,
    profiles: [
      { id: 'op_manager', name: '김서윤', title: '대표', role: 'manager', memberCode: 'OP-0001', phoneHash: null, phoneLast4: null, storeIds: ['store_dasek', 'store_realsicdan'], referralCode: null, createdAt: addDays(nowIso, -60), isDemo: true, status: 'active', preferredBrands: [] },
      { id: 'op_staff', name: '매장 직원', title: null, role: 'staff', memberCode: 'OP-0002', phoneHash: null, phoneLast4: null, storeIds: ['store_dasek', 'store_realsicdan'], referralCode: null, createdAt: addDays(nowIso, -60), isDemo: true, status: 'active', preferredBrands: [] },
    ],
    consents: [],
    menuCategories: [
      { id: 'rs_salad', brand: 'realsicdan', name: '샐러드', sortOrder: 0 },
      { id: 'rs_box', brand: 'realsicdan', name: '도시락', sortOrder: 1 },
      { id: 'rs_snack', brand: 'realsicdan', name: '간식', sortOrder: 2 },
      { id: 'dn_dessert', brand: 'dasek', name: '디저트', sortOrder: 0 },
      { id: 'dn_drink', brand: 'dasek', name: '음료', sortOrder: 1 },
    ],
    menuItems,
    cats,
    catPhotos,
    favorites: [],
    recentViews: [],
    events: [],
    checkins: [],
    verifications: [],
    loyaltyRules: rules,
    coupons: [],
    referrals: [],
    ledger: [],
    campaigns: [],
    notifications: [],
    reorderCandidates: [],
    tasks: [],
    proofEvents: [],
    auditLogs: [],
    roadmapInterest: [],
  };
}

/** 데모 이력 재생 */
/**
 * 다색냥 고양이 수: 25마리 (운영자 전달 정보 · 매장 확인 전).
 * 7~25번은 예시 이름·성향이며 사진은 CC0 샘플 사진 — 실제 이름·사진은 AX '메뉴·고양이 사진'에서 교체한다.
 */
export const DASEK_CAT_COUNT = 25;
type CatDef = [string, string, ArtSpec & { kind: 'cat' }, string[], string[]];
export const EXTRA_CATS: CatDef[] = [
  ['cat_7', '율무', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'green', pose: 'loaf', bg: 1 }, ['느긋함', '바닥 담당'], ['햇볕', '담요']],
  ['cat_8', '호두', { kind: 'cat', coat: 'gray', pattern: 'tabby', eyes: 'amber', pose: 'sit', bg: 2 }, ['산책 좋아함', '호기심'], ['풀 냄새', '창밖 구경']],
  ['cat_9', '도토리', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'amber', pose: 'sit', bg: 3 }, ['정면 응시', '차분함'], ['눈 맞춤', '조용한 손님']],
  ['cat_10', '깨비', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'green', pose: 'peek', bg: 4 }, ['관찰형', '도도함'], ['높은 곳', '깃털']],
  ['cat_11', '쿠키', { kind: 'cat', coat: 'gray', pattern: 'tabby', eyes: 'green', pose: 'sit', bg: 0 }, ['손 냄새 확인', '애교'], ['턱 쓰다듬기', '간식 시간']],
  ['cat_12', '솜이', { kind: 'cat', coat: 'gray', pattern: 'tabby', eyes: 'blue', pose: 'sleep', bg: 1 }, ['막내', '잠꾸러기'], ['낮잠', '부드러운 쿠션']],
  ['cat_13', '치즈', { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'sit', bg: 2 }, ['문지기', '사람 좋아함'], ['입구 자리', '인사']],
  ['cat_14', '망고', { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'blue', pose: 'loaf', bg: 3 }, ['뒹굴기', '장난꾸러기'], ['배 보이기', '공 굴리기']],
  ['cat_15', '귤이', { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'peek', bg: 4 }, ['활발함', '사냥 놀이'], ['낚싯대 장난감', '달리기']],
  ['cat_16', '루이', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'green', pose: 'sit', bg: 0 }, ['창가 담당', '사색가'], ['창밖 새 구경', '화분 옆']],
  ['cat_17', '호박', { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'green', pose: 'sit', bg: 1 }, ['꽃 좋아함', '순함'], ['화분 옆 자리', '햇살']],
  ['cat_18', '두부', { kind: 'cat', coat: 'white', pattern: 'tuxedo', eyes: 'green', pose: 'peek', bg: 2 }, ['조심성', '관찰형'], ['숨숨집', '조용한 곳']],
  ['cat_19', '설기', { kind: 'cat', coat: 'white', pattern: 'tuxedo', eyes: 'green', pose: 'loaf', bg: 3 }, ['느긋함', '무릎 고양이'], ['담요', '쓰다듬기']],
  ['cat_20', '찹쌀', { kind: 'cat', coat: 'white', pattern: 'tabby', eyes: 'amber', pose: 'sleep', bg: 4 }, ['배 보이기', '엉뚱함'], ['벤치', '뒹굴기']],
  ['cat_21', '산책이', { kind: 'cat', coat: 'brown', pattern: 'tabby', eyes: 'amber', pose: 'sit', bg: 0 }, ['산책길 담당', '자신감'], ['순찰', '손님 마중']],
  ['cat_22', '카푸', { kind: 'cat', coat: 'cream', pattern: 'point', eyes: 'blue', pose: 'loaf', bg: 1 }, ['우아함', '수다쟁이'], ['대화', '따뜻한 자리']],
  ['cat_23', '마루', { kind: 'cat', coat: 'cream', pattern: 'point', eyes: 'blue', pose: 'sit', bg: 2 }, ['포근함', '사람 좋아함'], ['빗질', '무릎']],
  ['cat_24', '연유', { kind: 'cat', coat: 'cream', pattern: 'point', eyes: 'blue', pose: 'peek', bg: 3 }, ['수줍음', '천천히 친해짐'], ['풀밭', '조용한 손님']],
  ['cat_25', '꾸벅이', { kind: 'cat', coat: 'brown', pattern: 'tuxedo', eyes: 'green', pose: 'sleep', bg: 4 }, ['낮잠 장인', '순둥이'], ['쿠션', '담요']],
];
const EXTRA_TAGLINES = [
  '바닥에 길게 누워 손님을 맞아요', '풀 냄새를 좋아하는 산책파', '빤히 바라보다 천천히 다가와요', '높은 곳에서 가게를 지켜봐요', '손 냄새부터 확인하는 신중파',
  '막내라 아직은 낮잠이 일순위', '입구에서 먼저 인사하는 문지기', '배를 보이며 뒹구는 장난꾸러기', '깃털만 보면 달려오는 사냥꾼', '창가에서 새를 구경하는 사색가',
  '화분 옆이 지정석이에요', '숨숨집에서 살짝 얼굴만 내밀어요', '담요 위에서 느긋하게 쉬어요', '벤치에서 배를 보이며 자요', '가게 앞 산책길 순찰 담당',
  '말을 걸면 대답하는 수다쟁이', '빗질을 좋아하는 포근한 친구', '천천히 친해지는 수줍은 친구', '쿠션에서 꾸벅꾸벅 졸아요',
];

export function createSeed(now: Date = new Date()): AppState {
  const nowIso = now.toISOString();
  const s = baseState(nowIso);
  const rnd = mulberry32(20261117);
  const at = (daysAgo: number, hour = 14, min = 0) => {
    const d = new Date(now.getTime() - daysAgo * DAY);
    const kstMidnight = new Date(dayKey(d) + 'T00:00:00+09:00');
    return new Date(Math.min(kstMidnight.getTime() + (hour * 60 + min) * 60000, now.getTime() - 60000)).toISOString();
  };
  const cust = (t: string): D.Ctx => ({ now: t, actorId: null, actorRole: 'customer', isDemo: true });
  const staff = (t: string): D.Ctx => ({ now: t, actorId: 'op_staff', actorRole: 'staff', isDemo: true });
  const mgr = (t: string): D.Ctx => ({ now: t, actorId: 'op_manager', actorRole: 'manager', isDemo: true });

  const names = ['하늘', '서윤', '도현', '지우', '민준', '하린', '예준', '수아', '시우', '유나', '건우', '채원', '은호', '다인'];
  const ids: string[] = [];
  names.forEach((n, i) => {
    const joined = i === 0 ? 40 : 6 + Math.floor(rnd() * 32);
    const phone = `0101234${String(1000 + i).slice(-4)}`;
    const refCode = i === 3 || i === 7 ? s.profiles.find((p) => p.id === ids[0])?.referralCode : undefined;
    const t = at(joined, 11 + Math.floor(rnd() * 8));
    const r = D.signup(s, cust(t), {
      name: `${n}`,
      phone,
      consents: { terms: true, privacy: true, age14: true, marketing_inapp: rnd() > 0.25 || i === 0, marketing_push: false, marketing_kakao: false },
      referralCode: refCode ?? undefined,
      preferredBrands: rnd() > 0.5 ? ['realsicdan', 'dasek'] : rnd() > 0.5 ? ['dasek'] : ['realsicdan'],
    });
    ids.push(r.userId);
  });
  // 데모 계정 표시용 이름 정리
  s.profiles.find((p) => p.id === ids[0])!.name = '하늘 (데모 고객)';

  const rsItems = s.menuItems.filter((m) => m.brand === 'realsicdan').map((m) => m.id);
  const dnItems = s.menuItems.filter((m) => m.brand === 'dasek').map((m) => m.id);

  ids.forEach((uidv, i) => {
    const p = s.profiles.find((x) => x.id === uidv)!;
    const joinedAgo = Math.floor((now.getTime() - new Date(p.createdAt).getTime()) / DAY);
    // 즐겨찾기
    const favN = i === 0 ? 2 : Math.floor(rnd() * 3);
    for (let k = 0; k < favN; k++) {
      const m = i === 0 ? ['m_chicken_salad', 'm_pie120'][k] : [...rsItems, ...dnItems][Math.floor(rnd() * (rsItems.length + dnItems.length))];
      if (!s.favorites.some((f) => f.userId === uidv && f.menuItemId === m)) D.toggleFavorite(s, cust(at(Math.max(1, joinedAgo - 2 - k), 20)), uidv, m);
    }
    // 이용 이력
    const uses = i === 0 ? 7 : i === 1 || i === 5 ? 0 : Math.floor(rnd() * 5);
    for (let k = 0; k < uses; k++) {
      const ago = Math.max(1, Math.floor(joinedAgo - 1 - (k * (joinedAgo - 1)) / Math.max(1, uses)));
      const visit = rnd() > 0.45;
      const t0 = at(ago, 13 + Math.floor(rnd() * 6), Math.floor(rnd() * 50));
      const tDecide = new Date(new Date(t0).getTime() + (3 + Math.floor(rnd() * 25)) * 60000).toISOString();
      if (visit) {
        try {
          const c = D.submitCheckin(s, cust(t0), uidv, 'store_dasek', dailyCheckinCode('store_dasek', dayKey(t0)));
          D.decideCheckin(s, staff(tDecide), c.id, true);
        } catch {
          /* 같은 날 중복은 건너뜀 */
        }
      } else {
        const items = rnd() > 0.5 ? [rsItems[Math.floor(rnd() * rsItems.length)]] : [dnItems[Math.floor(rnd() * dnItems.length)]];
        const storeId = items[0].startsWith('m_pie') || dnItems.includes(items[0]) ? 'store_dasek' : 'store_realsicdan';
        const v = D.selfReportPurchase(s, cust(t0), uidv, storeId, items, '');
        D.decidePurchase(s, staff(tDecide), v.id, true, { amount: s.menuItems.find((m) => m.id === items[0])?.price ?? null });
      }
    }
    // 링크 클릭 (자가 의향 — 실적 아님)
    if (rnd() > 0.4) D.recordLinkClick(s, cust(at(Math.floor(rnd() * 10) + 1, 19)), uidv, 'reservation', 'store_dasek', '네이버 예약 링크 열기');
    if (rnd() > 0.5) D.recordMenuView(s, cust(at(Math.floor(rnd() * 6) + 1, 12)), uidv, [...rsItems, ...dnItems][Math.floor(rnd() * 11)]);
  });

  // 비회원 조회 이벤트
  for (let k = 0; k < 18; k++) {
    D.recordCatView(s, cust(at(Math.floor(rnd() * 14), 10 + Math.floor(rnd() * 10))), null, s.cats[Math.floor(rnd() * s.cats.length)].id);
    if (k % 2) D.recordLinkClick(s, cust(at(Math.floor(rnd() * 7), 18)), null, 'reservation', 'store_dasek', '네이버 예약 링크 열기');
  }

  // 오늘 확인 대기 (큐)
  const today1 = new Date(now.getTime() - 22 * 60000).toISOString();
  const today2 = new Date(now.getTime() - 9 * 60000).toISOString();
  try {
    D.submitCheckin(s, cust(today1), ids[3], 'store_dasek', dailyCheckinCode('store_dasek', dayKey(today1)));
  } catch {
    /* noop */
  }
  try {
    D.submitCheckin(s, cust(today2), ids[9], 'store_dasek', dailyCheckinCode('store_dasek', dayKey(today2)));
  } catch {
    /* noop */
  }
  D.selfReportPurchase(s, cust(new Date(now.getTime() - 14 * 60000).toISOString()), ids[1], 'store_realsicdan', ['m_chicken_salad'], '포장 구매했어요');

  // 쿠폰 일부 사용
  for (const c of s.coupons.filter((c) => c.ruleId === 'rule_signup').slice(4, 9)) {
    try {
      D.redeemCoupon(s, staff(addDays(c.issuedAt, 2)), c.id);
    } catch {
      /* noop */
    }
  }

  // 지난 캠페인 1건 + 초안 1건
  const camp = D.createCampaign(s, mgr(at(12, 10)), { name: '가입 후 첫 방문 안내', segment: 'NEW_NO_VISIT', channel: 'IN_APP', ...D.campaignTemplate('NEW_NO_VISIT') });
  D.approveAndSendCampaign(s, mgr(at(12, 10, 20)), camp.id);
  D.createCampaign(s, staff(at(1, 16)), { name: '주말 디저트 안내 (초안)', segment: 'ALL_CONSENTED', channel: 'IN_APP', title: '주말엔 120겹파이', body: '산책길에 들러 바삭한 120겹파이와 쉬어가세요.' });

  // 사진 공개 승인 대기 1건 (예시)
  const pending: CatPhoto = { id: 'pho_pending_1', catId: 'cat_2', art: { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'peek', bg: 2 }, dataUrl: null, slot: null, caption: '새로 올라온 사진 (검토 대기)', alt: '보리(예시 일러스트) 새 사진', status: 'PENDING_REVIEW', sortOrder: 9, uploadedBy: 'op_staff', createdAt: at(0, 9) };
  s.catPhotos.push(pending);
  s.tasks.unshift({ id: 'tsk_photo_seed', type: 'PHOTO_REVIEW', refId: pending.id, userId: null, storeId: 'store_dasek', title: '보리 사진 공개 승인', status: 'OPEN', createdAt: at(0, 9), doneAt: null, doneBy: null });

  // 로드맵 관심 (예시)
  const rm = ['subscription_pickup', 'food_wellness', 'cat_companion', 'subscription_pickup', 'b2b_office', 'subscription_pickup'];
  rm.forEach((k, i) => D.toggleRoadmapInterest(s, cust(at(i + 1, 21)), ids[(i * 3) % ids.length], k, i % 2 === 0));

  s.notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  s.events.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  s.session.customerId = null;
  return s;
}

export const DEMO_CUSTOMER_NAME = '하늘 (데모 고객)';
