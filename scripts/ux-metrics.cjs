/**
 * UX 측정 (4차) — 같은 스크립트로 개선 전/후 빌드를 잰다.
 *   node scripts/ux-metrics.cjs http://localhost:3400 before docs/qa-v4/ux-before.json
 *
 * A. 첫 화면: 390×844 · 360×667 · 430×932 에서 핵심 요소의 실제 위치(하단 메뉴에 가리지 않는 영역 안인지)
 * B. 스크롤 길이: 문서 높이(px)와 화면 높이 배수
 * C. 업무 조작 수: 실제로 누른 횟수(탭)와, 누르기 전에 필요했던 스크롤(px). 경로는 새 화면 → 없으면 기존 화면 순서로 시도
 *    '화면 진입'(목적 화면이 열림)과 '업무 완료'(처리 결과 토스트 확인)를 구분해 기록한다.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [BASE, LABEL, OUT] = process.argv.slice(2);
if (!BASE || !OUT) throw new Error('usage: node scripts/ux-metrics.cjs <base> <label> <out.json>');

async function prime(page, { login = false, role = 'op_manager' } = {}) {
  await page.goto(BASE + '/privacy');
  await page.waitForFunction(() => localStorage.getItem('dasek-companion:state'));
  await page.evaluate(({ login, role }) => {
    const s = JSON.parse(localStorage.getItem('dasek-companion:state'));
    s.settings.customerOnboarded = true;
    s.settings.axTutorialDone = true;
    s.session.operatorId = role;
    if (login) s.session.customerId = s.profiles.find((x) => x.name.includes('데모 고객')).id;
    localStorage.setItem('dasek-companion:state', JSON.stringify(s));
    localStorage.setItem('dasek:device-view', 'pc');
  }, { login, role });
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await page.waitForTimeout(250);
}

/** 화면 아래 고정 메뉴 높이 */
const bottomBar = (page) =>
  page.evaluate(() => {
    const n = [...document.querySelectorAll('nav')].find((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().bottom >= innerHeight - 1 && el.getBoundingClientRect().height < 140);
    return n ? Math.round(n.getBoundingClientRect().height) : 0;
  });

/** 보이는 요소 중 조건에 맞는 첫 요소의 위치 (문서 기준) */
async function locate(page, spec) {
  return page.evaluate((spec) => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]');
    };
    let cands = [];
    if (spec.sel) cands = [...document.querySelectorAll(spec.sel)];
    if (spec.text) {
      const re = new RegExp(spec.text);
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (re.test(n.textContent)) cands.push(n.parentElement);
    }
    const el = cands.find(vis);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) };
  }, spec);
}

const FIRST_SCREEN = {
  '/ax': {
    identity: { sel: '[data-testid="ax-identity"]', text: '한곳에서 관리' },
    clock: { sel: '[data-testid="live-clock"]', text: '\\d{1,2}:\\d{2}:\\d{2}' },
    pendingCount: { sel: '[data-testid="urgent-count"], [data-testid="urgent-summary"] a' },
    primaryCta: { sel: '[data-testid="queue-approve"]' },
    kpi: { sel: '[data-testid="kpi-strip"], [data-testid="today-stats"]' },
    quickActions: { sel: '[data-testid="quick-actions"]', text: '^\\s*구매 등록\\s*$' },
    toCustomer: { sel: '[data-testid="to-customer"]' },
  },
  '/': {
    identity: { sel: 'h1' },
    realsicdan: { sel: '[data-testid="hero-realsicdan"]' },
    dasek: { sel: '[data-testid="hero-dasek"]' },
    signature: { text: '^(다색냥 대표 디저트|대표·인기 메뉴)$' },
    membership: { text: '가입하면 받는 혜택|첫 가입 혜택' },
  },
};

const SIZES = [
  { w: 390, h: 844 },
  { w: 360, h: 667 },
  { w: 430, h: 932 },
];

async function firstScreen(browser) {
  const out = {};
  for (const [route, items] of Object.entries(FIRST_SCREEN)) {
    for (const sz of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await prime(page);
      await page.goto(BASE + route);
      await settle(page);
      const nav = await bottomBar(page);
      const fold = sz.h - nav;
      const row = { fold };
      for (const [k, spec] of Object.entries(items)) {
        const p = await locate(page, spec);
        row[k] = p ? { ...p, inFirstScreen: p.top < fold && Math.min(p.bottom, p.top + 44) <= fold } : null;
      }
      out[`${route} @${sz.w}x${sz.h}`] = row;
      await ctx.close();
    }
  }
  return out;
}

async function scrollLengths(browser) {
  const routes = [
    ['/', false],
    ['/realsicdan', false],
    ['/dasek', false],
    ['/my', true],
    ['/ax', false],
    ['/ax/members', false],
  ];
  const out = {};
  for (const sz of SIZES.concat([{ w: 1440, h: 900 }])) {
    for (const [r, login] of routes) {
      const ctx = await browser.newContext({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await prime(page, { login });
      await page.goto(BASE + r);
      await settle(page);
      const hgt = await page.evaluate(() => document.documentElement.scrollHeight);
      out[`${r} @${sz.w}x${sz.h}`] = { px: hgt, screens: +(hgt / sz.h).toFixed(2) };
      await ctx.close();
    }
  }
  return out;
}

/** 조작 수 측정 — steps: [[후보 locator 함수...], ...] 각 단계에서 보이는 첫 후보를 누른다 */
async function tasks(browser) {
  const T = [
    {
      name: '방문 확인 (업무 완료)',
      start: '/ax',
      steps: [[(p) => p.getByTestId('queue-approve').filter({ hasText: '방문 확인' })]],
      done: (p) => p.getByText(/방문을 확인했어요/).first(),
    },
    {
      name: '구매 확인 (업무 완료)',
      start: '/ax',
      steps: [[(p) => p.getByTestId('queue-approve').filter({ hasText: '구매 확인' })], [(p) => p.getByTestId('purchase-confirm')]],
      done: (p) => p.getByText(/구매를 확인했어요/).first(),
    },
    {
      name: '회원 검색 (검색창 입력 가능)',
      start: '/ax',
      steps: [
        [(p) => p.getByTestId('qa-members'), (p) => p.getByRole('navigation', { name: '운영 하단 메뉴' }).getByRole('link', { name: '회원' }), (p) => p.getByTestId('ax-sidebar').getByRole('link', { name: /회원/ })],
        [(p) => p.locator('[data-testid="member-search"]:not(:focus)')],
      ],
      optionalLast: true,
      done: (p) => p.getByTestId('member-search'),
      verify: (p) => p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'member-search'),
    },
    {
      name: '쿠폰 확인 (쿠폰 사용 창 열림)',
      start: '/ax',
      steps: [[(p) => p.getByTestId('qa-coupon'), (p) => p.getByRole('button', { name: /쿠폰 사용/ })]],
      done: (p) => p.getByRole('dialog').filter({ hasText: /쿠폰/ }),
    },
    {
      name: '메뉴·사진 관리 진입',
      start: '/ax',
      steps: [
        [(p) => p.getByTestId('qa-content'), (p) => p.getByTestId('ax-sidebar').getByRole('link', { name: /메뉴·고양이/ }), (p) => p.getByRole('button', { name: '더보기' })],
        [(p) => p.getByRole('dialog', { name: '운영 메뉴' }).getByRole('link', { name: /메뉴·고양이/ })],
      ],
      optionalLast: true,
      doneUrl: /\/ax\/content/,
    },
    {
      name: 'AX → 고객 화면',
      start: '/ax',
      steps: [[(p) => p.getByTestId('to-customer'), (p) => p.getByTestId('ax-sidebar').getByTestId('surface-to-customer'), (p) => p.getByTestId('demo-tools-open')], [(p) => p.getByTestId('demo-to-customer')]],
      optionalLast: true,
      doneUrl: /:\d+\/$/,
    },
    {
      name: '고객 화면 → 시연용 AX',
      start: '/',
      steps: [[(p) => p.getByTestId('surface-to-ax'), (p) => p.getByTestId('demo-tools-open')], [(p) => p.getByTestId('demo-to-ax')]],
      optionalLast: true,
      doneUrl: /\/ax$/,
    },
  ];
  const out = {};
  for (const sz of [{ w: 390, h: 844 }, { w: 1440, h: 900 }]) {
    for (const t of T) {
      const ctx = await browser.newContext({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await prime(page);
      await page.goto(BASE + t.start);
      await settle(page);
      const fold = sz.h - (await bottomBar(page));
      let taps = 0;
      let scroll = 0;
      const pathTaken = [];
      let ok = true;
      for (let i = 0; i < t.steps.length; i++) {
        // 앞 단계로 이미 끝났으면 멈춘다
        if (t.optionalLast && i > 0) {
          if (t.doneUrl && t.doneUrl.test(page.url())) break;
          if (t.verify && (await t.verify(page))) break;
        }
        let hit = null;
        for (const c of t.steps[i]) {
          const l = c(page).filter({ visible: true }).first();
          if ((await l.count()) && (await l.isVisible().catch(() => false))) {
            hit = l;
            break;
          }
        }
        if (!hit) {
          ok = false;
          break;
        }
        const box = await hit.boundingBox();
        const absTop = box.y + (await page.evaluate(() => scrollY));
        const need = Math.max(0, Math.round(absTop + Math.min(box.height, 44) - (await page.evaluate(() => scrollY)) - fold));
        scroll += need;
        pathTaken.push(((await hit.innerText().catch(() => '')) || (await hit.getAttribute('aria-label')) || (await hit.getAttribute('data-testid')) || '?').trim().replace(/\s+/g, ' ').slice(0, 30));
        await hit.click();
        taps++;
        await page.waitForTimeout(350);
      }
      if (ok) {
        if (t.doneUrl) ok = t.doneUrl.test(page.url());
        else if (t.done) ok = await t.done(page).isVisible().catch(() => false);
        if (ok && t.verify) ok = (await t.verify(page)) || taps > 1;
      }
      out[`${t.name} @${sz.w}`] = { taps, scrollPx: scroll, ok, path: pathTaken };
      await ctx.close();
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const result = { label: LABEL, base: BASE, measuredAt: new Date().toISOString(), firstScreen: await firstScreen(browser), scroll: await scrollLengths(browser), tasks: await tasks(browser) };
  await browser.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ tasks: result.tasks }, null, 0));
})();
