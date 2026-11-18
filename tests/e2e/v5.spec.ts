/**
 * 5차 — 고양이 25마리 · 추가 확장 예정(대표 기획안) 접기 메뉴 · 발표용 시연 모드
 */
import { expect, test } from '@playwright/test';
import { audit, prime, settle } from './audit';

test('다색냥: 25마리 — 처음 4마리, 전체 보기에서 25마리 격자, 모두 예시 프로필 표시', async ({ page }) => {
  await prime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dasek');
  await expect(page.locator('#sec-friends').locator('..')).toContainText('다색냥 친구들 25마리');
  await expect(page.getByRole('region', { name: '고양이 프로필 카드' }).getByRole('link')).toHaveCount(4);
  await page.getByTestId('cats-show-all').click();
  await expect(page.getByTestId('cats-show-all')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('cats-grid').getByRole('link')).toHaveCount(25);
  await page.getByRole('link', { name: '꾸벅이 프로필 보기' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '꾸벅이' })).toBeVisible();
  await expect(page.locator('main')).toContainText('예시');
  expect(await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)).toBe(0);
});

test('AX 사이드바: 추가 확장 예정은 평소 접혀 있고, 펼쳐서 항목을 누르면 짧은 소개가 열린다', async ({ page }) => {
  await prime(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ax');
  const nav = page.getByTestId('ax-sidebar').getByTestId('expansion-nav');
  const toggle = nav.getByRole('button', { name: /추가 확장 예정/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav.getByTestId('expansion-item-nutrition_log')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await nav.getByTestId('expansion-item-nutrition_log').click();
  const sheet = page.getByTestId('expansion-sheet');
  await expect(sheet).toContainText('확장 예정');
  await expect(sheet).toContainText('도입되면');
  await expect(sheet).toContainText('지금 앱에서는');
  await expect(sheet).toContainText('숫자를 추정해 보여주지 않아요');
  await expect(sheet).toContainText('김서윤 대표');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  // 다른 화면으로 가면 다시 접힌다 (따라다니지 않음)
  await page.getByTestId('ax-sidebar').getByRole('link', { name: '회원 관리' }).click();
  await expect(page).toHaveURL(/\/ax\/members/);
  await expect(page.getByTestId('ax-sidebar').getByTestId('expansion-nav').getByRole('button', { name: /추가 확장 예정/ })).toHaveAttribute('aria-expanded', 'false');
});

test('고객 홈: 접힌 확장 예정 → 항목 관심 등록이 AX 집계에 반영', async ({ page }) => {
  await prime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.getByTestId('expansion-nav');
  await nav.getByRole('button', { name: /추가 확장 예정/ }).click();
  await nav.getByTestId('expansion-item-cat_goods').click();
  await page.getByTestId('expansion-interest').click();
  await expect(page.getByTestId('expansion-interest')).toHaveText('관심 취소');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ax');
  const ax = page.getByTestId('ax-sidebar').getByTestId('expansion-nav');
  await ax.getByRole('button', { name: /추가 확장 예정/ }).click();
  await ax.getByTestId('expansion-item-cat_goods').click();
  await expect(page.getByTestId('expansion-sheet')).toContainText(/고객 관심 등록 [1-9]\d*건/);
});

test('발표용 시연 모드: 가입 → 체크인 → 직원 확인이 실제 데이터로 이어지고, 처음부터로 되돌린다', async ({ page }) => {
  await prime(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/demo');
  await expect(page.getByTestId('demo-frame-customer').locator('iframe')).toBeVisible();
  await expect(page.getByTestId('demo-frame-ax').locator('iframe')).toBeVisible();
  await expect(page.getByTestId('demo-stamps')).toHaveText('—');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('demo-step')).toContainText('친구 추천 코드로 가입');
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-referral')).toHaveText('대기');
  await page.getByTestId('demo-next').click();
  const q0 = Number((await page.getByTestId('demo-queue').textContent())!.replace(/\D/g, ''));
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-queue')).toHaveText(`${q0 + 1}건`);
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-stamps')).toHaveText('1');
  await expect(page.getByTestId('demo-referral')).toHaveText('확정');
  await expect(page.getByTestId('demo-action')).toBeDisabled();
  // 같은 데이터: 고객 화면(iframe)에도 스탬프 1
  const phone = page.frameLocator('[data-testid="demo-frame-customer"] iframe');
  await expect(phone.getByText('1 / 10').or(phone.getByText(/^1$/)).first()).toBeVisible();
  // 크게 보기
  await page.getByTestId('demo-focus-ax').click();
  await expect(page.getByTestId('demo-frame-customer')).toBeHidden();
  await page.getByTestId('demo-focus-both').click();
  // 마지막 단계: 대표 기획안
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-next').click();
  await expect(page.getByTestId('demo-step')).toContainText('AI 푸드 웰니스');
  // 처음부터
  await page.getByTestId('demo-restart').click();
  await page.getByTestId('demo-restart-confirm').click();
  await expect(page.getByTestId('demo-stamps')).toHaveText('—');
  await expect(page.getByTestId('demo-step')).toContainText('다색컴패니언은 무엇인가');
});

test('시연 모드 화면 품질 (대비·글자 크기·터치·넘침)', async ({ page }) => {
  await prime(page);
  for (const w of [390, 768, 1440]) {
    await page.setViewportSize({ width: w, height: w < 800 ? 844 : 900 });
    await page.goto('/demo');
    await settle(page);
    const a = await audit(page, { touch: w <= 768 });
    expect({ w, contrast: a.contrast, tiny: a.tiny, touch: a.touch, overflow: a.overflow }).toEqual({ w, contrast: [], tiny: [], touch: [], overflow: 0 });
  }
});
