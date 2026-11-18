/**
 * 4차 — 1초 직관 UX 검증 (실제 위치·동작을 잰다)
 * A 첫 화면 정보  D 단계 공개  E 실시간 시계  F 프로필·제작 표기  + 전환 버튼·모바일 카드·역할별 우선순위·고빈도 업무 조작 수
 */
import { expect, test, type Page } from '@playwright/test';
import { prime } from './audit';

async function fold(page: Page) {
  const vh = page.viewportSize()!.height;
  const nav = await page.getByRole('navigation', { name: '운영 하단 메뉴' }).boundingBox().catch(() => null);
  return nav && nav.height < 140 ? nav.y : vh;
}
async function topOf(page: Page, testId: string) {
  const b = await page.getByTestId(testId).filter({ visible: true }).first().boundingBox();
  expect(b, `${testId} 가 화면에 그려져야 함`).not.toBeNull();
  return b!;
}

test.describe('A. AX 모바일 첫 화면', () => {
  for (const vp of [
    { width: 390, height: 844, kpi: true },
    { width: 430, height: 932, kpi: true },
    { width: 360, height: 667, kpi: false },
  ]) {
    test(`${vp.width}×${vp.height}: 정체성·날짜·대기 건수·바로 확인 버튼이 스크롤 없이 보인다`, async ({ page }) => {
      await prime(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/ax');
      await page.waitForLoadState('networkidle');
      const f = await fold(page);
      await expect(page.getByTestId('ax-identity')).toContainText('한곳에서 관리');
      for (const id of ['ax-identity', 'live-clock', 'urgent-count']) {
        const b = await topOf(page, id);
        expect(b.y + b.height, `${id} 첫 화면 안`).toBeLessThanOrEqual(f);
      }
      const cta = await page.getByTestId('queue-approve').first().boundingBox();
      expect(cta!.y + cta!.height, '첫 확인 버튼이 첫 화면 안').toBeLessThanOrEqual(f);
      expect(cta!.height).toBeGreaterThanOrEqual(44);
      if (vp.kpi) {
        const k = await topOf(page, 'kpi-strip');
        expect(k.y + 60, '핵심 수치(라벨+숫자)가 첫 화면 안').toBeLessThanOrEqual(f);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('고빈도 업무: 방문 확인 1번, 회원 검색·메뉴 사진·고객 화면 전환 1번', async ({ page }) => {
    await prime(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ax');
    // 방문 확인 — 홈에서 바로 1번 (스크롤 없음은 위 테스트에서 확인)
    await page.getByTestId('queue-approve').filter({ hasText: '방문 확인' }).first().click();
    await expect(page.getByText(/방문을 확인했어요/).first()).toBeVisible();
    // 회원 검색 — 1번 누르면 검색창에 바로 입력 가능
    await page.getByTestId('qa-members').click();
    await expect(page).toHaveURL(/\/ax\/members/);
    await expect(page.getByTestId('member-search')).toBeFocused();
    await page.keyboard.type('지우');
    await expect(page.getByTestId('member-cards')).toContainText('지우');
    // 메뉴·사진 관리 — 1번
    await page.goto('/ax');
    await page.getByTestId('qa-content').click();
    await expect(page).toHaveURL(/\/ax\/content/);
    // 고객 화면 — 머리글 버튼 1번
    await page.getByTestId('to-customer').filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/:\d+\/$/);
  });
});

test.describe('E. 실시간 한국 시계', () => {
  test('KST·초 단위로 바뀌고, 화면을 옮겨도 동작하며 하이드레이션 오류가 없다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await prime(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ax');
    const clock = page.getByTestId('live-clock').filter({ visible: true }).first();
    await expect(clock).toHaveAttribute('data-kst-time', /^\d{2}:\d{2}:\d{2}$/);
    const t1 = await clock.getAttribute('data-kst-time');
    await page.waitForTimeout(1300);
    const t2 = await clock.getAttribute('data-kst-time');
    expect(t2).not.toBe(t1);
    // 서울 시각과 일치 (±3초)
    const kst = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date());
    const sec = (x: string) => x.split(':').reduce((a, v) => a * 60 + Number(v), 0);
    expect(Math.abs(sec(t2!) - sec(kst)) % 86400).toBeLessThanOrEqual(3);
    // 데이터 기준과 현재 시각은 다른 곳·다른 말로
    await expect(page.getByTestId('data-basis')).toContainText('DEMO 시연 데이터');
    await expect(page.getByTestId('data-basis')).not.toContainText(t2!);
    // 화면 이동 후에도 계속
    await page.getByTestId('ax-sidebar').getByRole('link', { name: '회원 관리' }).click();
    await expect(page).toHaveURL(/\/ax\/members/);
    const t3 = await page.getByTestId('live-clock').filter({ visible: true }).first().getAttribute('data-kst-time');
    await page.waitForTimeout(1100);
    expect(await page.getByTestId('live-clock').filter({ visible: true }).first().getAttribute('data-kst-time')).not.toBe(t3);
    expect(errors.filter((e) => /hydrat|did not match/i.test(e))).toEqual([]);
  });

  test('자정이 지나면 날짜가 자동으로 바뀐다 (KST 23:59:58 → 다음 날)', async ({ page }) => {
    await prime(page);
    await page.clock.install({ time: new Date('2026-11-18T14:59:58Z') }); // = KST 23:59:58
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ax');
    const clock = page.getByTestId('live-clock').filter({ visible: true }).first();
    await expect(clock).toHaveAttribute('data-kst-date', '2026-11-18');
    await page.clock.runFor(3000);
    await expect(clock).toHaveAttribute('data-kst-date', '2026-11-19');
    await expect(clock).toContainText('2026.11.19');
  });
});

test.describe('F. 운영자 프로필·제작 표기', () => {
  test('PC 사이드바 하단 — 메뉴가 길어도 보이고, 역할을 바꾸면 신분도 바뀐다', async ({ page }) => {
    await prime(page);
    await page.setViewportSize({ width: 1280, height: 600 }); // 메뉴가 화면보다 긴 상황
    await page.goto('/ax');
    const prof = page.getByTestId('operator-profile').filter({ visible: true });
    await expect(prof).toBeVisible();
    const b = (await prof.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(600);
    await expect(prof).toContainText('김서윤 대표');
    await expect(prof).toContainText('운영 책임자');
    await expect(prof).toContainText('DEMO');
    await expect(page.getByTestId('maker-credit').filter({ visible: true })).toHaveText('제작 · 미래에이아이랩');
    // 직원으로 보기 → 김서윤 대표가 직원인 것처럼 보이지 않음
    await page.getByTestId('role-switch').getByRole('radio', { name: '직원' }).click();
    await expect(prof).toContainText('매장 직원');
    await expect(prof).not.toContainText('김서윤');
    await expect(page.locator('#tier-4')).toHaveCount(0); // 직원 홈에는 분석·성과 블록 없음
    await page.getByTestId('role-switch').getByRole('radio', { name: '책임자' }).click();
    await expect(page.locator('#tier-4')).toHaveCount(1);
  });

  test('모바일 메뉴(Drawer) 하단에 프로필·역할·제작 표기', async ({ page }) => {
    await prime(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ax');
    await page.getByTestId('ax-menu').click();
    const drawer = page.getByTestId('ax-drawer');
    await expect(drawer.getByTestId('operator-profile')).toContainText('김서윤 대표');
    await expect(drawer.getByTestId('maker-credit')).toBeVisible();
    await expect(drawer.getByTestId('role-switch')).toBeVisible();
    const b = (await drawer.getByTestId('maker-credit').boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(844);
  });
});

test.describe('전환 버튼', () => {
  test('AX → 고객: PC·모바일 모두 머리글에 청록색 버튼 / 고객 → AX: 시연용 버튼(DEMO 전용)', async ({ page }) => {
    await prime(page);
    for (const vp of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto('/ax');
      const btn = page.getByTestId('to-customer').filter({ visible: true }).first();
      await expect(btn).toBeVisible();
      const box = (await btn.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(vp.width > 1000 ? 40 : 44);
      expect(box.y).toBeLessThan(70); // 머리글 안
      const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toBe('rgb(27, 122, 146)'); // brand-600 = 고객 플랫폼 색
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('surface-to-ax')).toHaveText(/시연용 AX 보기/);
    await page.getByTestId('surface-to-ax').click();
    await expect(page).toHaveURL(/\/ax$/);
  });
});

test.describe('D. 단계적 공개', () => {
  test('펼치기는 aria-expanded 로 상태를 알리고, 접혀 있어도 데이터는 DOM 에 남는다', async ({ page }) => {
    await prime(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ax');
    const btn = page.getByTestId('today-more').getByRole('button');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('today-stats')).toBeHidden();
    await expect(page.getByTestId('today-stats')).toContainText('확인된 방문'); // 접힌 상태에서도 유지
    // 키보드로 연다
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('today-stats')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    // 화면 설명 더보기 (기술 용어는 펼친 설명 안에 보존)
    await page.goto('/ax/evidence');
    const more = page.getByRole('button', { name: '설명 더보기' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(page.locator('main')).toContainText('Proof Event');
    // 리얼식단: 처음 6개 → 전체 보기
    await page.goto('/realsicdan');
    const grid = page.getByTestId('menu-grid');
    const first = await grid.locator(':scope > *').count();
    expect(first).toBeLessThanOrEqual(6);
    const total = Number((await page.locator('main').getByText(/^\d+개 · 확인된 메뉴/).first().textContent())!.match(/\d+/)![0]);
    if (total > 6) {
      await page.getByTestId('menu-show-all').click();
      await expect(grid.locator(':scope > *')).toHaveCount(total);
    } else {
      await expect(page.getByTestId('menu-show-all')).toHaveCount(0);
      expect(first).toBe(total);
    }
    // 다색냥 교감 수칙: 핵심은 항상 보이고, 이유만 펼친다
    await page.goto('/dasek');
    await expect(page.getByTestId('rules-core')).toContainText('억지로 안지 않아요');
  });

  test('회원 관리: 휴대폰·태블릿은 카드, PC 는 표', async ({ page }) => {
    await prime(page);
    for (const [w, cards] of [
      [390, true],
      [768, true],
      [1280, false],
    ] as const) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto('/ax/members');
      await expect(page.getByTestId('member-cards')).toBeVisible({ visible: cards });
      await expect(page.getByTestId('member-table')).toBeVisible({ visible: !cards });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  });
});
