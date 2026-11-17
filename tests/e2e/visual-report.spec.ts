/**
 * 시각 품질 측정 리포트 — AUDIT_REPORT=<파일경로> 일 때만 실행 (전후 비교 기록용)
 *   AUDIT_REPORT=docs/qa-v3/audit-before.json npx playwright test visual-report
 */
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { audit, AX_ROUTES, CUSTOMER_ROUTES, prime, settle, THEMES } from './audit';

const OUT = process.env.AUDIT_REPORT;
test.skip(!OUT, 'AUDIT_REPORT 미지정');

test('visual quality report', async ({ page }) => {
  test.setTimeout(900_000);
  const rows: Record<string, unknown>[] = [];
  const run = async (route: string, width: number, extra: Record<string, string> = {}) => {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
    await page.goto(route);
    await settle(page);
    const r = await audit(page, { touch: width <= 768 });
    rows.push({ route, width, ...extra, texts: r.texts, contrast: r.contrast.length, tiny: r.tiny.length, smallAx: r.smallAx.length, dimmed: r.dimmed.length, touch: r.touch.length, cardEdge: r.cardEdge.length, clipped: r.clipped.length, overflow: r.overflow, onMedia: r.onMedia, samples: { contrast: r.contrast.slice(0, 6), tiny: r.tiny.slice(0, 4), smallAx: r.smallAx.slice(0, 4), dimmed: r.dimmed.slice(0, 4), touch: r.touch.slice(0, 6), cardEdge: r.cardEdge.slice(0, 3) } });
  };
  await prime(page);
  for (const w of [390, 673, 768, 1440]) for (const r of [...CUSTOMER_ROUTES, ...AX_ROUTES]) await run(r, w);
  for (const t of THEMES) {
    await prime(page, { theme: t });
    for (const w of [390, 1440]) for (const r of ['/ax', '/ax/queue', '/ax/members']) await run(r, w, { theme: t });
  }
  const sum = (k: string) => rows.reduce((n, x) => n + (x[k] as number), 0);
  const summary = { rows: rows.length, texts: sum('texts'), contrast: sum('contrast'), tiny: sum('tiny'), smallAx: sum('smallAx'), dimmed: sum('dimmed'), touch: sum('touch'), cardEdge: sum('cardEdge'), clipped: sum('clipped'), overflowRows: rows.filter((x) => (x.overflow as number) > 0).length };
  mkdirSync(dirname(OUT!), { recursive: true });
  writeFileSync(OUT!, JSON.stringify({ summary, rows }, null, 1));
  console.log(JSON.stringify(summary));
});
