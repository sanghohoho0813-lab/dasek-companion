import { expect, test, type Page } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1366, height: 900 };
// 2×2 빨간 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');

async function brokenImages(page: Page) {
  return page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
}

test('home: photo-led layout, categories route to filters, no broken images', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('산책길에서 만나는');
  await expect(page.getByText('샘플 사진').first()).toBeVisible();
  // 지연 로딩 이미지까지 불러오기
  for (let y = 0; y < 6000; y += 700) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(120);
  }
  await page.waitForLoadState('networkidle');
  expect(await brokenImages(page)).toEqual([]);
  await page.goto('/');
  await page.getByRole('link', { name: '도시락', exact: true }).first().click();
  await expect(page).toHaveURL(/\/realsicdan\?cat=rs_box/);
  await expect(page.getByRole('button', { name: '도시락', pressed: true })).toBeVisible();
  await expect(page.getByTestId('menu-grid')).toContainText('다이어트 도시락');
});

test('menu detail: mobile action bar stays on screen; channels shown without fake order states', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/menu/m_pie120');
  const bar = page.getByTestId('save-menu-m');
  await expect(bar).toBeInViewport();
  const box = (await bar.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(MOBILE.height);
  await expect(page.getByTestId('order-channels')).toContainText('매장에서 구매');
  await expect(page.getByTestId('order-channels')).toContainText('확인 중');
  await expect(page.locator('body')).not.toContainText('주문 완료');
  await expect(page.locator('body')).not.toContainText('배달 예약 확정');
});

test('AX content edits reflect on customer screens (menu photo, cat cover)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  // 메뉴 사진 교체
  await page.goto('/ax/content');
  await page.getByRole('button', { name: '120겹파이 수정' }).click();
  await page.getByTestId('menu-photo-input').setInputFiles({ name: 'pie.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('사진을 바꿨어요.')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '닫기' }).first().click();
  await page.goto('/menu/m_pie120');
  const img = page.locator('img[alt="120겹파이 사진"]').first();
  await expect(img).toHaveAttribute('src', /^data:image\/jpeg/);
  // 고양이 대표 사진 변경
  await page.goto('/ax/content?tab=cats');
  await page.getByRole('button', { name: /편집/ }).first().click();
  const manager = page.getByTestId('cat-photo-manager');
  await expect(manager).toBeVisible();
  await manager.getByTestId('set-cover').first().click();
  await expect(page.getByText('대표 사진으로 지정했어요.')).toBeVisible();
  const state = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('dasek-companion:state')!);
    const p = s.catPhotos.filter((x: { catId: string; status: string }) => x.catId === 'cat_1' && x.status === 'PUBLISHED').sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)[0];
    return p.slot as string;
  });
  expect(state).not.toBe('cat_01_01');
  await page.goto('/dasek');
  await expect(page.getByRole('link', { name: '모카 프로필 보기' }).locator('img')).toHaveAttribute('src', new RegExp(state));
});

test('roadmap interest is counted in AX analytics', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/analytics');
  const row = page.locator('li', { hasText: '냉장고 재료 레시피' });
  const before = Number((await row.locator('b').textContent())!.trim());
  await page.goto('/roadmap');
  await page.getByTestId('roadmap-fridge_recipe').click();
  await expect(page.getByTestId('roadmap-sheet')).toContainText('지금은 제공하지 않아요');
  await page.getByTestId('roadmap-interest').click();
  await page.goto('/ax/analytics');
  await expect(page.locator('li', { hasText: '냉장고 재료 레시피' }).locator('b')).toHaveText(String(before + 1));
});

test('AX home shows work-first tiers and quick staff actions', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax');
  const tiers = page.locator('h2[id^="tier-"]');
  await expect(tiers).toHaveText(['지금 처리할 일', '오늘 매장 현황', '다음 행동', '분석 · 실증']);
  await expect(page.getByTestId('urgent-summary')).toContainText('방문·구매 확인 대기');
  await expect(page.getByTestId('content-fixes')).toContainText('예시 고양이 프로필');
  // 첫 화면 큐에서 바로 확인 → 오늘 현황 반영
  const visitsBefore = Number((await page.getByTestId('today-stats').locator('div', { hasText: '확인된 방문' }).locator('p.text-\\[26px\\]').first().textContent())!.trim());
  await page.getByTestId('queue-approve').filter({ hasText: '방문 확인' }).first().click();
  await expect(page.getByTestId('today-stats').locator('div', { hasText: '확인된 방문' }).locator('p.text-\\[26px\\]').first()).toHaveText(String(visitsBefore + 1));
  await page.getByTestId('queue-search').waitFor({ state: 'detached' }).catch(() => {});
  await page.goto('/ax/queue');
  await page.getByTestId('queue-search').fill('없는이름');
  await expect(page.getByText('대기 중인 요청이 없어요')).toBeVisible();
});

test('font scale setting applies to both surfaces', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/ax/settings');
  await page.getByRole('tab', { name: '크게' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'lg');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-font', 'lg');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.goto('/ax/settings');
  await page.getByRole('tab', { name: '보통' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'md');
});

test('phone: demo tools switch surfaces and show scaled PC preview with route sync', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await page.getByTestId('demo-tools-open').first().click();
  await expect(page.getByTestId('demo-tools')).toContainText('PC+Mobile 동시 보기는');
  await page.getByTestId('demo-to-ax').click();
  await expect(page).toHaveURL(/\/ax$/);
  await expect(page.getByTestId('demo-tools')).toHaveCount(0);
  // AX에서 다시 고객 화면으로
  await page.getByTestId('demo-tools-open').first().click();
  await page.getByTestId('demo-to-customer').click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  // PC 미리보기: 1280px iframe, 프레임 안 이동이 부모 주소에 반영
  await page.getByTestId('demo-tools-open').first().click();
  await page.getByTestId('demo-pc-preview').click();
  const frameEl = page.getByTestId('pc-preview').locator('iframe');
  await expect(frameEl).toBeVisible();
  expect(await frameEl.evaluate((f: HTMLIFrameElement) => f.clientWidth)).toBe(1280);
  const frame = page.frameLocator('[data-testid="pc-preview"] iframe');
  await frame.getByRole('link', { name: '다색냥', exact: true }).first().click();
  await expect(page).toHaveURL(/\/dasek$/);
  await expect(frame.getByTestId('demo-tools-open')).toHaveCount(0); // 프레임 안 재귀 없음
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByTestId('pc-preview-close').click();
  await expect(page.getByTestId('pc-preview')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: '다색냥' })).toBeVisible();
});
