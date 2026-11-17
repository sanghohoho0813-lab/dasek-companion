import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <p className="text-[0.8125rem] font-bold tracking-[0.2em] text-brand-600">404</p>
        <h1 className="mt-2 text-[1.5rem] font-extrabold text-ink">페이지를 찾을 수 없어요</h1>
        <p className="mt-1 text-[0.875rem] text-ink-3">주소가 바뀌었거나 아직 준비 중인 화면이에요.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-[0.875rem] font-bold text-white">
            고객 홈
          </Link>
          <Link href="/ax" className="inline-flex h-11 items-center rounded-xl bg-canvas px-5 text-[0.875rem] font-bold text-ink">
            운영 AX
          </Link>
        </div>
      </div>
    </div>
  );
}
