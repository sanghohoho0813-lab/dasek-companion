'use client';
import { useEffect } from 'react';
import { useAppState } from '@/lib/store';

/** 저장된 설정(AX 테마·글자 크기)을 <html>에 반영 — PC와 Mobile Frame이 같은 값을 공유 */
export function Prefs() {
  const s = useAppState();
  const theme = s?.settings.axTheme;
  const font = s?.settings.fontScale;
  useEffect(() => {
    if (theme) document.documentElement.dataset.axTheme = theme;
    if (font) document.documentElement.dataset.font = font;
  }, [theme, font]);
  return null;
}
