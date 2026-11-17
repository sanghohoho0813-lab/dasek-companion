'use client';
import { useEffect } from 'react';
import { resetDemo } from '@/lib/store';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-[22px] font-extrabold text-ink">화면을 표시하지 못했어요</h1>
        <p className="mt-1 text-[14px] text-ink-3">잠시 후 다시 시도해 주세요. 계속되면 데모 데이터를 초기화해 보세요.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={reset} className="h-11 rounded-xl bg-brand-600 px-5 text-[14px] font-bold text-white">
            다시 시도
          </button>
          <button
            onClick={() => {
              resetDemo();
              reset();
            }}
            className="h-11 rounded-xl bg-canvas px-5 text-[14px] font-bold text-ink"
          >
            데모 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
