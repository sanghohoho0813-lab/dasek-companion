/**
 * 시각 품질 게이트 (3차) — 실제 브라우저에서 계산된 값으로 잰다.
 * 2차 코드(4b83dbd)에서는 대비 2,534건·12px 미만 887건·AX 13px 미만 5,804건·터치 1,149건으로 실패한다
 * (docs/qa-v3/audit-before.json). 기준을 낮춰 통과시키지 않는다.
 */
import { expect, test, type Page } from '@playwright/test';
import { audit, AX_ROUTES, CUSTOMER_ROUTES, prime, settle, THEMES } from './audit';

type Fail = { at: string; problems: Record<string, unknown> };

async function sweep(page: Page, routes: string[], widths: number[], tag = '') {
  const fails: Fail[] = [];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: w < 800 ? 844 : 900 });
    for (const r of routes) {
      await page.goto(r);
      await settle(page);
      const a = await audit(page, { touch: w <= 768 });
      const problems: Record<string, unknown> = {};
      if (a.contrast.length) problems.contrast = a.contrast.slice(0, 5);
      if (a.tiny.length) problems.tiny = a.tiny.slice(0, 5);
      if (a.smallAx.length) problems.smallAx = a.smallAx.slice(0, 5);
      if (a.dimmed.length) problems.dimmed = a.dimmed.slice(0, 5);
      if (a.touch.length) problems.touch = a.touch.slice(0, 5);
      if (a.cardEdge.length) problems.cardEdge = a.cardEdge.slice(0, 5);
      if (a.clipped.length) problems.clipped = a.clipped.slice(0, 5);
      if (a.overflow > 0) problems.overflow = a.overflow;
      if (Object.keys(problems).length) fails.push({ at: `${tag}${r} @${w}`, problems });
    }
  }
  return fails;
}

test.describe('visual quality gate', () => {
  test.describe.configure({ timeout: 600_000 });

  test('mobile·tablet widths: customer + AX (contrast, size, touch 44px, edges, overflow)', async ({ page }) => {
    await prime(page);
    expect(await sweep(page, [...CUSTOMER_ROUTES, ...AX_ROUTES], [360, 430, 673, 768])).toEqual([]);
  });

  test('desktop widths: customer + AX', async ({ page }) => {
    await prime(page);
    expect(await sweep(page, [...CUSTOMER_ROUTES, ...AX_ROUTES], [1024, 1280, 1920])).toEqual([]);
  });

  test('7 AX themes keep body text neutral and readable', async ({ page }) => {
    const fails: Fail[] = [];
    for (const t of THEMES) {
      await prime(page, { theme: t });
      fails.push(...(await sweep(page, ['/ax', '/ax/queue', '/ax/members', '/ax/content', '/ax/rewards', '/ax/settings'], [390, 1440], `[${t}] `)));
      // 본문 글자는 테마 색으로 물들지 않는다 (강조색 역할만 테마)
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ax/members');
      await settle(page);
      const body = await page.locator('main p').first().evaluate((el) => getComputedStyle(el).color);
      const [r, g, b] = body.match(/\d+/g)!.map(Number);
      expect(Math.max(r, g, b) - Math.min(r, g, b), `[${t}] 본문 글자색이 무채색 계열이어야 함: ${body}`).toBeLessThanOrEqual(40);
    }
    expect(fails).toEqual([]);
  });

  test('text size setting scales with rem (no CSS zoom) and stays within the viewport', async ({ page }) => {
    const sizes: Record<string, { root: number; title: number; zoom: string }> = {};
    for (const f of ['sm', 'md', 'lg'] as const) {
      await prime(page, { font: f });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/ax');
      await settle(page);
      sizes[f] = await page.evaluate(() => ({
        root: parseFloat(getComputedStyle(document.documentElement).fontSize),
        title: parseFloat(getComputedStyle(document.querySelector('header h1')!).fontSize),
        zoom: getComputedStyle(document.body).zoom || '1',
      }));
    }
    // 운영 AX 는 고객 화면보다 한 단계 크게 (보통 17px)
    expect(sizes.sm.root).toBe(16);
    expect(sizes.md.root).toBe(17);
    expect(sizes.lg.root).toBeCloseTo(18.7, 1);
    // 고객 화면 '보통'은 그대로 16px
    await prime(page, { font: 'md' });
    await page.goto('/');
    await settle(page);
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(16);
    for (const f of ['sm', 'md', 'lg'] as const) expect(['1', 'normal']).toContain(sizes[f].zoom);
    // 글자는 설정 비율만큼 커진다 (폭과 무관)
    expect(sizes.lg.title / sizes.md.title).toBeCloseTo(1.1, 1);
    await prime(page, { font: 'lg' });
    expect(await sweep(page, ['/', '/realsicdan', '/menu/m_pie120', '/my', '/ax', '/ax/queue', '/ax/members', '/ax/campaigns'], [360, 768, 1280], '[lg] ')).toEqual([]);
  });

  test('stacked overlay: Esc closes only the top layer (lightbox → page stays)', async ({ page }) => {
    await prime(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dasek/cats/cat_r01');
    await settle(page);
    await page.getByRole('button', { name: /크게 보기/ }).first().click();
    const lightbox = page.getByTestId('cat-lightbox');
    await expect(lightbox).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
    await expect(page).toHaveURL(/\/dasek\/cats\/cat_r01$/);
    // 시트 → Esc 로 닫힘, 아래 화면 유지
    await page.getByTestId('demo-tools-open').first().click();
    await expect(page.getByTestId('demo-tools')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('demo-tools')).toBeHidden();
    await expect(page).toHaveURL(/\/dasek\/cats\/cat_r01$/);
  });

  test('reduced motion turns off entrance animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await prime(page);
    await page.goto('/');
    const names = await page.evaluate(() => [...document.querySelectorAll('.route-in, .reveal > *')].slice(0, 5).map((el) => getComputedStyle(el).animationName));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n).toBe('none');
  });
});
