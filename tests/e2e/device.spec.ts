import { expect, test } from '@playwright/test';

test('Device View: PC / Mobile / PC+Mobile with route sync and no recursion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ax');
  await expect(page.getByTestId('device-switch')).toBeVisible();

  // Mobile 단독
  await page.getByTestId('device-mobile').click();
  const frameEl = page.getByTestId('device-frame').locator('iframe');
  await expect(frameEl).toBeVisible();
  expect(await frameEl.evaluate((f: HTMLIFrameElement) => f.clientWidth)).toBe(390);

  // PC+Mobile
  await page.getByTestId('device-dual').click();
  await expect(page.getByTestId('dual-view')).toBeVisible();
  const frame = page.frameLocator('[data-testid="device-frame"] iframe');
  await expect(frame.locator('nav[aria-label="운영 하단 메뉴"]')).toBeVisible(); // 실제 모바일 레이아웃
  await expect(frame.getByTestId('device-switch')).toHaveCount(0); // 재귀 금지
  await expect(frame.getByTestId('device-frame')).toHaveCount(0);

  // PC → Mobile
  await page.getByTestId('ax-sidebar').getByRole('link', { name: '회원 관리' }).click();
  await expect(page).toHaveURL(/\/ax\/members$/);
  // 4차: 390px 프레임에서는 표 대신 카드 목록
  await expect(frame.getByTestId('member-cards')).toBeVisible();

  // Mobile → PC
  await frame.getByRole('navigation', { name: '운영 하단 메뉴' }).getByRole('link', { name: /^확인/ }).click();
  await expect(page).toHaveURL(/\/ax\/queue/);

  // 같은 데이터
  const pcCount = await page.getByTestId('queue-row').count();
  await expect(frame.getByTestId('queue-row')).toHaveCount(pcCount);

  // 가로 넘침 없음
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // 새로고침 후 모드 유지
  await page.reload();
  await expect(page.getByTestId('dual-view')).toBeVisible();

  // 상태 공유: PC에서 테마 바꾸면 Mobile Frame도 바뀜
  await page.goto('/ax/settings');
  await page.getByTestId('theme-emerald-gold').click();
  await expect(frame.locator('html')).toHaveAttribute('data-ax-theme', 'emerald-gold');
  await page.getByTestId('theme-pure-white').click();

  await page.getByTestId('device-pc').click();
  await expect(page.getByTestId('dual-view')).toHaveCount(0);
});

test('real mobile browser hides Device View', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ax');
  await expect(page.getByTestId('device-switch')).toHaveCount(0);
});

const ROUTES = ['/', '/credits', '/my/coupons', '/realsicdan', '/menu/m_chicken_salad', '/dasek', '/dasek/cats/cat_3', '/my', '/signup', '/membership', '/roadmap', '/checkin', '/ax', '/ax/queue', '/ax/members', '/ax/content', '/ax/rewards', '/ax/campaigns', '/ax/analytics', '/ax/reorder', '/ax/evidence', '/ax/settings', '/ax/why', '/ax/coach'];
const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920];

test('no horizontal overflow and no runtime errors across widths', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const problems: string[] = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const r of ROUTES) {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (o > 0) problems.push(`${r}@${w}: +${o}px`);
    }
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});
