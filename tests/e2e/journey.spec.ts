import { expect, test, type Page } from '@playwright/test';
import { dailyCheckinCode } from '../../src/lib/util';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1366, height: 900 };

async function noOverflow(page: Page) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(o, 'horizontal overflow').toBeLessThanOrEqual(0);
}

test('primary journey: explore → signup(referral) → check-in & purchase → staff verify → rewards → proof → reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize(MOBILE);

  // 1) 비회원 탐색
  await page.goto('/');
  await expect(page.getByTestId('hero-dasek')).toBeVisible();
  await noOverflow(page);
  await page.getByTestId('hero-dasek').click();
  await expect(page).toHaveURL(/\/dasek$/);
  await page.getByRole('link', { name: '보리 프로필 보기' }).first().click();
  await expect(page.getByRole('heading', { name: '보리', level: 1 })).toBeVisible();
  await expect(page.getByTestId('cat-gallery')).toBeVisible();
  await page.getByRole('button', { name: /1번째 사진 크게 보기/ }).click();
  await expect(page.getByTestId('cat-lightbox')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('cat-lightbox')).toContainText('2/4');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('cat-lightbox')).toBeHidden();

  // 2) 추천인(데모 고객) 코드 확보
  const referrerCode = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('dasek-companion:state')!);
    return s.profiles.find((p: { name: string }) => p.name === '하늘 (데모 고객)').referralCode as string;
  });

  // 3) 추천 링크로 가입
  await page.goto(`/signup?ref=${referrerCode}`);
  await expect(page.getByTestId('signup-ref')).toHaveValue(referrerCode);
  await page.getByTestId('signup-name').fill('테스트회원');
  await page.getByTestId('signup-phone').fill('010-5555-0101');
  await page.getByTestId('signup-submit').click();
  await expect(page.getByText('필수 항목에 동의해 주세요.')).toBeVisible();
  await page.getByTestId('consent-terms').check();
  await page.getByTestId('consent-privacy').check();
  await page.getByTestId('consent-age14').check();
  await page.getByTestId('consent-marketing_inapp').check();
  await page.getByTestId('signup-submit').click();
  await expect(page.getByTestId('signup-done')).toBeVisible();
  await expect(page.getByTestId('signup-done')).toContainText('추천 코드가 적용됐어요');

  // 4) 메뉴 저장
  await page.goto('/menu/m_pie120');
  await page.getByTestId('save-menu-m').click();
  await expect(page.getByTestId('save-menu-m')).toHaveAttribute('aria-pressed', 'true');

  // 5) 방문 체크인 (오늘의 코드)
  await page.goto('/checkin?store=store_dasek');
  await page.getByTestId('checkin-code').fill('0000');
  await page.getByTestId('checkin-submit').click();
  const code = dailyCheckinCode('store_dasek');
  if (code !== '0000') await expect(page.getByText(/코드가 맞지 않습니다/)).toBeVisible();
  await page.getByTestId('checkin-code').fill(code);
  await page.getByTestId('checkin-submit').click();
  await expect(page.getByTestId('checkin-result')).toContainText('직원 확인을 기다리고');

  // 6) 구매 확인 요청 (리얼식단)
  await page.goto('/my');
  const memberCode = (await page.getByTestId('member-code').textContent())!.trim();
  await page.getByTestId('my-report').click();
  await page.getByTestId('purchase-sheet').getByRole('button', { name: '리얼식단', exact: true }).click();
  await page.getByTestId('purchase-sheet').getByRole('button', { name: '닭가슴살 샐러드' }).click();
  await page.getByTestId('purchase-submit').click();
  await expect(page.getByTestId('purchase-sheet')).toBeHidden();
  await page.goto('/my/activity');
  await expect(page.getByTestId('activity-list')).toContainText('확인 대기');

  // 7) 운영 AX에서 직원 확인
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/queue');
  const rows = page.getByTestId('queue-row').filter({ hasText: '테스트회원' });
  await expect(rows).toHaveCount(1);
  await rows.first().getByTestId('queue-approve').click();
  await page.getByRole('tab', { name: /구매 확인/ }).click();
  const buyRow = page.getByTestId('queue-row').filter({ hasText: '테스트회원' });
  await buyRow.getByTestId('queue-approve').click();
  await page.getByRole('dialog').getByRole('textbox').fill('9900');
  await page.getByTestId('purchase-confirm').click();
  await expect(page.getByTestId('queue-row').filter({ hasText: '테스트회원' })).toHaveCount(0);

  // 8) 회원 상세에 반영
  await page.goto('/ax/members');
  await page.getByTestId('member-search').fill(memberCode);
  await page.getByRole('link', { name: '테스트회원' }).click();
  await expect(page.getByText('확인 이용').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('2회');

  // 9) Proof 생성 확인
  await page.goto('/ax/evidence');
  await expect(page.getByTestId('proof-table')).toContainText('REFERRAL_CONVERTED');
  await expect(page.getByTestId('proof-table')).toContainText('VERIFIED_PURCHASE');

  // 10) 고객 화면으로 복귀 → 스탬프·알림 반영
  await page.setViewportSize(MOBILE);
  await page.goto('/my');
  await expect(page.getByLabel(/스탬프 2개/)).toBeVisible();
  await page.goto('/my/inbox');
  await expect(page.getByTestId('inbox-list')).toContainText('구매가 확인되었어요');

  // 11) 추천인 보상 확정 확인
  await page.goto('/login');
  await page.getByRole('button', { name: /하늘 \(데모 고객\)/ }).click();
  await page.goto('/my/referral');
  await expect(page.locator('main')).toContainText('보상 확정');

  // 12) 미래 서비스 관심
  await page.goto('/roadmap');
  await page.getByTestId('roadmap-subscription_pickup').click();
  await expect(page.getByTestId('roadmap-sheet')).toContainText('지금은 제공하지 않아요');
  const before = (await page.getByTestId('roadmap-interest').textContent())!.trim();
  await page.getByTestId('roadmap-interest').click();
  await expect(page.getByTestId('roadmap-interest')).toHaveText(before === '관심 있어요' ? '관심 취소' : '관심 있어요');

  // 13) 데모 초기화 후 복구
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax');
  await page.getByRole('button', { name: '데모 초기화' }).click();
  await page.getByTestId('demo-reset-confirm').click();
  await page.goto('/ax/members');
  await page.getByTestId('member-search').fill('테스트회원');
  await expect(page.getByText('조건에 맞는 회원이 없어요.')).toBeVisible();

  expect(errors).toEqual([]);
});

test('staff role cannot change rules or send campaigns', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/rewards');
  await page.getByTestId('role-switch').getByRole('radio', { name: '직원' }).click();
  await expect(page.getByText(/규칙 변경·캠페인 승인·쿠폰 취소는 잠겨 있어요/)).toBeVisible();
  await expect(page.getByTestId('edit-STAMP')).toHaveCount(0);
  await page.goto('/ax/campaigns');
  await expect(page.getByTestId('campaign-send')).toHaveCount(0);
  await page.getByTestId('role-switch').getByRole('radio', { name: '책임자' }).click();
  await expect(page.getByTestId('campaign-send').first()).toBeVisible();
});

test('manager flow: reorder candidate approval and campaign send', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/reorder');
  await page.getByTestId('reorder-refresh').click();
  const before = await page.getByTestId('reorder-approve').count();
  expect(before).toBeGreaterThan(0);
  await page.getByTestId('reorder-approve').first().click();
  await expect(page.getByTestId('reorder-approve')).toHaveCount(before - 1);
  await page.goto('/ax/campaigns');
  await page.getByTestId('seg-ALL_CONSENTED').click();
  await page.getByTestId('campaign-create').click();
  await page.getByTestId('campaign-send').first().click();
  await expect(page.getByText('승인하고 앱 알림으로 발송했어요.')).toBeVisible();
});

test('7 canonical themes switch and persist', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/settings');
  const ids = ['deep-navy', 'navy-gold', 'emerald-gold', 'forest-sage', 'deep-teal', 'onyx-gold', 'pure-white'];
  for (const id of ids) {
    await page.getByTestId(`theme-${id}`).click();
    await expect(page.locator('html')).toHaveAttribute('data-ax-theme', id);
  }
  await page.getByTestId('theme-deep-teal').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ax-theme', 'deep-teal');
  await page.getByTestId('theme-pure-white').click();
});

test('sheets close with Escape and browser back', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/realsicdan');
  await page.getByTestId('filter-open').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByTestId('filter-open').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/realsicdan/);
  await expect(page.locator('body')).toHaveCSS('overflow', 'visible');
});
