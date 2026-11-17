import { describe, expect, it } from 'vitest';
import { isTopOverlay, overlayDepth, popOverlay, pushOverlay } from '@/lib/overlay';

describe('overlay stack (Esc·뒤로가기 닫힘 순서)', () => {
  it('맨 위 팝업만 닫힘 대상이고, 닫으면 아래 팝업이 다시 맨 위가 된다', () => {
    pushOverlay('sheet');
    pushOverlay('lightbox');
    expect(isTopOverlay('lightbox')).toBe(true);
    expect(isTopOverlay('sheet')).toBe(false);
    popOverlay('lightbox');
    expect(isTopOverlay('sheet')).toBe(true);
    popOverlay('sheet');
    expect(overlayDepth()).toBe(0);
    expect(isTopOverlay('sheet')).toBe(false);
  });

  it('중간 팝업이 먼저 사라져도 맨 위는 유지된다', () => {
    pushOverlay('a');
    pushOverlay('b');
    pushOverlay('c');
    popOverlay('b');
    expect(isTopOverlay('c')).toBe(true);
    popOverlay('c');
    expect(isTopOverlay('a')).toBe(true);
    popOverlay('a');
    expect(overlayDepth()).toBe(0);
  });
});
