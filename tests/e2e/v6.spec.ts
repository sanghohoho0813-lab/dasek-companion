/**
 * 6차 — 핵심 시나리오 2개와 발표 시연의 반복 안정성 (실제 상태·화면으로 검증)
 */
import { expect, test, type Page } from '@playwright/test';
import { prime } from './audit';

const W = { width: 1440, height: 900 };

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('dasek-companion:state')!));

async function runScenarioA(page: Page) {
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-referral')).toHaveText('대기');
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-action')).toBeDisabled();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click();
  await expect(page.getByTestId('demo-stamps')).toHaveText('1');
  await expect(page.getByTestId('demo-referral')).toHaveText('확정');
}

async function runScenarioB(page: Page) {
  await page.goto('/demo?step=7');
  for (const k of ['save', 'send', 'open']) {
    await page.getByTestId(`demo-action-${k}`).click();
    await expect(page.getByTestId(`demo-action-${k}`)).toBeDisabled();
  }
  await expect(page.getByTestId('demo-campaign-확인')).toHaveText('1');
  await expect(page.getByTestId('demo-campaign-후속 행동')).toHaveText('1');
  await expect(page.getByTestId('demo-campaign-확인 방문')).toHaveText('0');
}

test('시나리오 A: 가입 → 체크인 → 직원 확인이 같은 손님에게 귀속되고 손님·AX 화면이 일치', async ({ page, context }) => {
  const errors = watchErrors(page);
  await prime(page);
  await page.setViewportSize(W);
  const before = await state(page);
  const othersBefore = JSON.stringify({ c: before.checkins.length, cp: before.coupons.filter((x: { userId: string }) => !x.userId.startsWith('usr_')).length });
  await runScenarioA(page);
  const s = await state(page);
  const u = s.profiles.find((p: { name: string }) => p.name === '시연 고객');
  // 같은 손님에게 귀속
  expect(s.checkins.filter((c: { userId: string; status: string }) => c.userId === u.id && c.status === 'CONFIRMED')).toHaveLength(1);
  expect(s.proofEvents.some((p: { user_id: string; event_type: string }) => p.user_id === u.id && p.event_type === 'VERIFIED_VISIT')).toBe(true);
  expect(s.referrals.find((r: { refereeId: string }) => r.refereeId === u.id).status).toBe('REWARDED');
  // 다른 회원의 기존 쿠폰·체크인은 그대로 (새 체크인 1건만 추가)
  expect(s.checkins.length).toBe(before.checkins.length + 1);
  expect(JSON.stringify({ c: s.checkins.length - 1, cp: s.coupons.filter((x: { userId: string }) => !x.userId.startsWith('usr_')).length })).toBe(othersBefore);

  // 손님 화면 (새 탭 = 같은 브라우저 저장소)
  const customer = await context.newPage();
  await customer.goto('/my');
  await expect(customer.getByTestId('member-code')).toHaveText(u.memberCode.replace(/^DC-/, ''));
  await expect(customer.locator('main')).toContainText('1 / 10');
  await customer.goto('/my/activity');
  await expect(customer.getByTestId('activity-list')).toContainText('직원 확인');
  await customer.goto('/my/inbox');
  await expect(customer.getByTestId('inbox-list')).toContainText('방문이 확인되었어요');
  // 운영 AX
  await customer.goto(`/ax/members/${u.id}`);
  await expect(customer.locator('main')).toContainText('시연 고객');
  await expect(customer.locator('main')).toContainText('1회');
  await customer.goto('/ax/evidence');
  await expect(customer.getByTestId('proof-table')).toContainText('방문 확인');
  expect(errors).toEqual([]);
});

test('중복 방지: 연타·되돌아가 다시 눌러도 한 번만 반영', async ({ page }) => {
  await prime(page);
  await page.setViewportSize(W);
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').dblclick();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').dblclick();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').dblclick();
  await page.getByTestId('demo-prev').click();
  await expect(page.getByTestId('demo-action')).toBeDisabled();
  const s = await state(page);
  const users = s.profiles.filter((p: { name: string }) => p.name === '시연 고객');
  expect(users).toHaveLength(1);
  const id = users[0].id;
  expect(s.checkins.filter((c: { userId: string }) => c.userId === id)).toHaveLength(1);
  expect(s.ledger.filter((l: { kind: string; sourceRef: string; status: string }) => l.kind === 'REFERRAL_REWARD' && l.status === 'CONFIRMED' && s.referrals.find((r: { id: string; refereeId: string }) => r.id === l.sourceRef)?.refereeId === id)).toHaveLength(1);
  const keys = s.coupons.map((c: { idempotencyKey: string }) => c.idempotencyKey);
  expect(new Set(keys).size).toBe(keys.length);
});

test('시나리오 B: 저장 → 관심 회원 → 책임자 승인 → 알림 → 열람 → AX 결과 (방문 실적은 0)', async ({ page, context }) => {
  const errors = watchErrors(page);
  await prime(page);
  await page.setViewportSize(W);
  await runScenarioA(page);
  await runScenarioB(page);
  const s = await state(page);
  const u = s.profiles.find((p: { name: string }) => p.name === '시연 고객');
  const n = s.notifications.find((x: { userId: string; kind: string }) => x.userId === u.id && x.kind === 'MARKETING');
  expect(n.link).toBe('/menu/m_chicken_salad');
  expect(n.readAt).not.toBeNull();
  const ax = await context.newPage();
  await ax.goto(`/ax/members/${u.id}`);
  await expect(ax.getByTestId('member-interest')).toContainText('닭가슴살 샐러드');
  await expect(ax.getByTestId('member-interest')).toContainText('확인함');
  await ax.goto('/ax/campaigns');
  const row = ax.locator('li', { hasText: '시연 관심 안내' });
  await expect(row.getByTestId('campaign-result')).toContainText('알림 확인1');
  await expect(row.getByTestId('campaign-result')).toContainText('확인 이용0');
  // 같은 대상 재발송은 중복 제외 (책임자가 다시 승인해도)
  await ax.goto('/ax/campaigns?segment=RECENT_INTEREST');
  await ax.getByTestId('campaign-create').click();
  await ax.locator('li', { hasText: '최근 7일 메뉴 저장' }).first().getByRole('button', { name: /승인·발송/ }).click();
  const s2 = await state(ax);
  expect(s2.notifications.filter((x: { userId: string; kind: string }) => x.userId === u.id && x.kind === 'MARKETING')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('발표 시연 3회 연속: 처음부터 → 8단계 → 초기화, 상태 누락·중복·오류 0', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await prime(page);
  await page.setViewportSize(W);
  for (let round = 1; round <= 3; round++) {
    await page.goto('/demo?step=1');
    await page.getByTestId('demo-restart').click();
    await page.getByTestId('demo-restart-confirm').click();
    await expect(page.getByTestId('demo-stamps')).toHaveText('—');
    for (let k = 0; k < 2; k++) await page.keyboard.press('ArrowRight');
    await page.getByTestId('demo-action').click();
    await page.keyboard.press('ArrowRight');
    await page.getByTestId('demo-action').click();
    await page.keyboard.press('ArrowRight');
    await page.getByTestId('demo-action').click();
    await expect(page.getByTestId('demo-change')).toContainText('스탬프');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('demo-proof')).toContainText('직원 확인');
    await page.keyboard.press('ArrowRight');
    for (const k of ['save', 'send', 'open']) await page.getByTestId(`demo-action-${k}`).click();
    await expect(page.getByTestId('demo-campaign-확인 방문')).toHaveText('0');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('demo-stages')).toContainText('지금 — DEMO');
    const s = await state(page);
    const users = s.profiles.filter((p: { name: string }) => p.name === '시연 고객');
    expect(users, `round ${round}`).toHaveLength(1);
    expect(s.checkins.filter((c: { userId: string; status: string }) => c.userId === users[0].id && c.status === 'CONFIRMED')).toHaveLength(1);
    expect(s.campaigns.filter((c: { name: string }) => c.name === '시연 관심 안내')).toHaveLength(1);
    // 두 화면이 모두 실제로 그려져 있다
    await expect(page.getByTestId('demo-frame-customer')).toHaveAttribute('data-loaded', 'true');
    await expect(page.getByTestId('demo-frame-ax')).toHaveAttribute('data-loaded', 'true');
  }
  expect(errors).toEqual([]);
});

test('새로고침·뒤로가기·팝업 중 단계 이동·이어서 하기', async ({ page }) => {
  await prime(page);
  await page.setViewportSize(W);
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').click();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click();
  // 새로고침: 같은 단계·같은 상태
  await page.reload();
  await expect(page.getByTestId('demo-step')).toContainText('매장에 와서 체크인');
  await expect(page.getByTestId('demo-action')).toBeDisabled();
  await expect(page.getByTestId('demo-queue')).toHaveText(/\d+건/);
  // 다른 화면에 갔다가 뒤로가기
  await page.goto('/ax');
  await page.goBack();
  await expect(page.getByTestId('demo-step')).toContainText('매장에 와서 체크인');
  // 팝업이 열린 상태에서는 키보드 단계 이동이 일어나지 않는다
  await page.getByTestId('demo-restart').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('demo-step')).toContainText('매장에 와서 체크인');
  // 앞 단계 없이 실행하려 하면 '먼저 할 일'을 안내
  await page.getByTestId('demo-restart').click();
  await page.getByTestId('demo-restart-confirm').click();
  await page.goto('/demo?step=5');
  await expect(page.getByTestId('demo-action')).toBeDisabled();
  await expect(page.getByTestId('demo-requires')).toContainText('오늘의 코드로 체크인');
  await page.getByTestId('demo-requires').getByRole('button', { name: /4단계로 이동/ }).click();
  await expect(page.getByTestId('demo-step')).toContainText('매장에 와서 체크인');
  // 주소에 단계 없이 열면, 기록이 있을 때 이어서 하기 안내
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').click();
  await page.goto('/demo');
  await expect(page.getByTestId('demo-resume')).toBeVisible();
  await page.getByTestId('demo-resume').getByRole('button', { name: '이어서 하기' }).click();
  await expect(page.getByTestId('demo-step')).toContainText('매장에 와서 체크인');
});

test('탭 간 동기화: 다른 탭의 운영 AX·손님 화면이 새로고침 없이 바뀐다 (같은 브라우저 저장소)', async ({ page, context }) => {
  await prime(page);
  await page.setViewportSize(W);
  const ax = await context.newPage();
  await ax.setViewportSize(W);
  await ax.goto('/ax');
  const count = ax.getByTestId('urgent-count').locator('span').first();
  const q0 = Number((await count.textContent())!.trim());
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').click();
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click(); // 체크인
  await expect(count).toHaveText(String(q0 + 1)); // 다른 탭, 새로고침 없음
  const my = await context.newPage();
  await my.goto('/my');
  await expect(my.locator('main')).toContainText('0 / 10');
  await page.getByTestId('demo-next').click();
  await page.getByTestId('demo-action').click(); // 직원 확인
  await expect(count).toHaveText(String(q0));
  await expect(my.locator('main')).toContainText('1 / 10'); // 손님 탭도 새로고침 없이
});

test('초기화는 다색컴패니언 시연 데이터만 — 다른 저장 정보는 그대로', async ({ page }) => {
  await prime(page);
  await page.setViewportSize(W);
  await page.evaluate(() => {
    localStorage.setItem('other-app:key', 'keep');
    sessionStorage.setItem('other-app:session', 'keep');
  });
  await page.goto('/demo?step=3');
  await page.getByTestId('demo-action').click();
  await page.getByTestId('demo-restart').click();
  await page.getByTestId('demo-restart-confirm').click();
  const kept = await page.evaluate(() => ({ a: localStorage.getItem('other-app:key'), b: sessionStorage.getItem('other-app:session'), d: localStorage.getItem('dasek:device-view') }));
  expect(kept).toEqual({ a: 'keep', b: 'keep', d: 'pc' });
  const s = await state(page);
  expect(s.profiles.some((p: { name: string }) => p.name === '시연 고객')).toBe(false);
});
