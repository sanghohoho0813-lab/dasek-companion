export const DAY = 86_400_000;

let counter = 0;
export function uid(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** 한국 시간 기준 날짜 키 (YYYY-MM-DD) */
export function dayKey(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const kst = new Date(date.getTime() + 9 * 3_600_000);
  return kst.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString();
}

export function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / DAY);
}

/**
 * DEMO 전용 비암호 해시 (FNV-1a).
 * LIVE에서는 서버 측 salted SHA-256(HMAC)으로 교체한다 — DECISIONS.md D-07 참고.
 */
export function demoHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** 매장별 오늘의 체크인 코드(4자리). 매일 바뀌어 지난 코드 재사용을 막는다. */
export function dailyCheckinCode(storeId: string, day: string = dayKey()): string {
  const n = parseInt(demoHash(`${storeId}:${day}:dasek-checkin`), 16) % 10000;
  return n.toString().padStart(4, '0');
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

export function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
}

export function won(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString('ko-KR')}원`;
}

export function fmtDate(iso: string | null | undefined, opts: { time?: boolean } = {}): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const s = d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul' });
  if (!opts.time) return s;
  const t = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
  return `${s} ${t}`;
}

export function relTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}일 전`;
  return fmtDate(iso);
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** 결정적 의사난수 (시드 데이터 재현용) */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
