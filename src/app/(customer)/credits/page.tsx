import samples from '@/lib/samples.manifest.json';
import { BackHeader } from '@/components/customer/Shell';

export const metadata = { title: '샘플 사진 출처' };

type Credit = { file: string; title: string | null; creator: string | null; license: string; license_version: string | null; source: string; landing: string };

export default function CreditsPage() {
  const rows = Object.entries(samples as unknown as Record<string, Credit>);
  return (
    <div>
      <BackHeader title="샘플 사진 출처" />
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6 md:pt-10">
        <h1 className="text-[1.5rem] font-extrabold text-ink">샘플 사진 출처</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
          화면의 &lsquo;샘플 사진&rsquo;은 실제 다색냥·리얼식단의 매장·메뉴·고양이 사진이 <b>아닙니다</b>. 권리가 확인된 실제 사진이 준비되기 전까지 사용하는 CC0(퍼블릭 도메인 기증)·공개 도메인 스톡 사진이며, Openverse 검색으로 수집했습니다.
        </p>
        <ul className="mt-6 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
          {rows.map(([slot, c]) => (
            <li key={slot} className="flex flex-col gap-0.5 px-4 py-3 text-[0.8125rem] md:flex-row md:items-center md:gap-3">
              <span className="w-44 shrink-0 font-mono text-[0.8125rem] text-ink-3">{slot}</span>
              <span className="min-w-0 flex-1 truncate text-ink-2">{c.title ?? '(제목 없음)'}{c.creator ? ` · ${c.creator}` : ''}</span>
              <span className="shrink-0 font-semibold text-ink">{c.license.toUpperCase()} · {c.source}</span>
              <a href={c.landing} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold text-brand-700 hover:underline">
                원본
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
