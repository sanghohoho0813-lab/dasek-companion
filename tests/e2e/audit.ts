/**
 * 시각 품질 자 (비원미래 check_theme / check_scale 방식을 다색컴패니언에 맞게 재해석)
 * 브라우저에서 실제 계산된 스타일로 잰다 — CSS 클래스가 있다는 것만으로 PASS 하지 않는다.
 *
 *  contrast  : 글자색(알파 포함)을 실제 배경 층과 섞어 WCAG 대비 계산. 일반 4.5:1, 큰 글자(24px↑ 또는 18.66px↑ 굵게) 3:1
 *              사진 위 글자(data-on-media 안)는 따로 센다(배경이 사진이라 자로 잴 수 없음 — 스크림으로 보장).
 *  tiny      : 의미 있는 글자 12px 미만 (배지 data-badge 포함 전부)
 *  smallAx   : 운영 AX 본문 13px 미만 (배지 제외)
 *  dimmed    : 부모 opacity 때문에 흐려진 글자 (비활성 컨트롤 제외)
 *  touch     : 44×44 미만 누를 것 (문단 안 인라인 링크·data-touch-exempt 제외) — 모바일·태블릿 폭에서만
 *  cardEdge  : .card / .ax-card 테두리가 카드 바탕 대비 1.25:1 미만
 *  clipped   : 숫자·금액(.tabular) 잘림
 *  overflow  : 가로 넘침(px)
 */
import type { Page } from '@playwright/test';

export interface AuditResult {
  contrast: string[];
  onMedia: number;
  tiny: string[];
  smallAx: string[];
  dimmed: string[];
  touch: string[];
  cardEdge: string[];
  clipped: string[];
  overflow: number;
  texts: number;
}

export async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await page.waitForTimeout(150);
}

export async function audit(page: Page, opts: { touch: boolean }): Promise<AuditResult> {
  return page.evaluate((o) => {
    type C = { r: number; g: number; b: number; a: number };
    const parse = (s: string): C | null => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (f: C, b: C): C => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const lum = (c: C) => {
      const t = [c.r, c.g, c.b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
    };
    const ratio = (a: C, b: C) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const bgOf = (el: Element): C => {
      const layers: C[] = [];
      let n: Element | null = el;
      while (n) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
        n = n.parentElement;
      }
      let bg: C = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
      return bg;
    };
    const label = (el: Element) => `${el.tagName.toLowerCase()}「${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)}」`;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      if (el.closest('[aria-hidden="true"], [hidden], .sr-only, svg')) return false;
      return true;
    };
    const isAx = location.pathname.startsWith('/ax');
    const res = { contrast: [] as string[], onMedia: 0, tiny: [] as string[], smallAx: [] as string[], dimmed: [] as string[], touch: [] as string[], cardEdge: [] as string[], clipped: [] as string[], overflow: 0, texts: 0 };

    const all = Array.from(document.body.querySelectorAll('*'));
    for (const el of all) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0);
      if (!own || !visible(el)) continue;
      if (el.closest('[data-audit-skip]')) continue;
      res.texts++;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const disabled = !!el.closest(':disabled, [aria-disabled="true"]');
      if (size < 12) res.tiny.push(`${label(el)} ${size}px`);
      if (isAx && size < 13 && !el.closest('[data-badge]')) res.smallAx.push(`${label(el)} ${size}px`);
      let op = 1;
      for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
      if (op < 0.99 && !disabled) res.dimmed.push(`${label(el)} opacity ${op.toFixed(2)}`);
      if (el.closest('[data-on-media]')) {
        res.onMedia++;
        continue;
      }
      const fg = parse(cs.color);
      if (!fg || disabled) continue;
      const bg = bgOf(el);
      const r = ratio(over(fg, bg), bg);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      if (r < (large ? 3 : 4.5)) res.contrast.push(`${label(el)} ${r.toFixed(2)}:1 ${size}px`);
    }

    if (o.touch) {
      const sel = 'a[href], button, [role=button], [role=tab], [role=radio], [role=switch], input:not([type=hidden]), select, textarea';
      for (const el of Array.from(document.querySelectorAll(sel))) {
        if (!visible(el) || el.closest('[data-touch-exempt], [data-audit-skip]')) continue;
        if ((el as HTMLButtonElement).disabled) continue;
        const r = el.getBoundingClientRect();
        // 문단 속 인라인 링크는 글자 크기를 따르므로 제외 (WCAG 2.5.8 예외)
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
        // 체크박스·라디오는 감싸는 label 이 누를 자리
        const area = (el.tagName === 'INPUT' && el.closest('label')) ? el.closest('label')!.getBoundingClientRect() : r;
        if (area.width < 43.5 || area.height < 43.5) res.touch.push(`${label(el) || el.getAttribute('aria-label')} ${Math.round(area.width)}×${Math.round(area.height)}`);
      }
    }

    for (const el of Array.from(document.querySelectorAll('.card, .ax-card'))) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      const bw = parseFloat(cs.borderTopWidth);
      const bc = parse(cs.borderTopColor);
      const bg = bgOf(el);
      const outside = el.parentElement ? bgOf(el.parentElement) : bg;
      const edge = bc ? Math.max(ratio(over(bc, bg), bg), ratio(over(bc, outside), outside)) : 1;
      if (bw < 1 || edge < 1.25) res.cardEdge.push(`${label(el)} border ${bw}px ${edge.toFixed(2)}:1`);
    }
    for (const el of Array.from(document.querySelectorAll('.tabular'))) {
      if (!visible(el)) continue;
      const h = el as HTMLElement;
      if (h.scrollWidth > h.clientWidth + 1 && getComputedStyle(h).overflow !== 'visible') res.clipped.push(label(el));
    }
    res.overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    return res;
  }, opts);
}

export const CUSTOMER_ROUTES = ['/', '/realsicdan', '/menu/m_pie120', '/dasek', '/dasek/cats/cat_r05', '/membership', '/my', '/my/coupons', '/my/referral', '/signup', '/roadmap', '/checkin'];
export const AX_ROUTES = ['/ax', '/ax/queue', '/ax/members', '/ax/content', '/ax/rewards', '/ax/campaigns', '/ax/analytics', '/ax/reorder', '/ax/evidence', '/ax/settings', '/ax/coach', '/ax/why'];
export const THEMES = ['deep-navy', 'navy-gold', 'emerald-gold', 'forest-sage', 'deep-teal', 'onyx-gold', 'pure-white'];

/** 데모 계정으로 로그인 + 온보딩/튜토리얼 끄기 + 테마 */
export async function prime(page: Page, opts: { theme?: string; font?: 'sm' | 'md' | 'lg' } = {}) {
  await page.goto('/privacy');
  await page.waitForFunction(() => localStorage.getItem('dasek-companion:state'));
  await page.evaluate((o) => {
    const s = JSON.parse(localStorage.getItem('dasek-companion:state')!);
    s.settings.customerOnboarded = true;
    s.settings.axTutorialDone = true;
    if (o.theme) s.settings.axTheme = o.theme;
    if (o.font) s.settings.fontScale = o.font;
    const u = s.profiles.find((x: { name: string }) => x.name.includes('데모 고객'));
    s.session.customerId = u.id;
    localStorage.setItem('dasek-companion:state', JSON.stringify(s));
    localStorage.setItem('dasek:device-view', 'pc');
  }, opts);
}
