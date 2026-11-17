import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { DeviceProvider, FrameSync } from '@/components/device/Device';
import { Prefs } from '@/components/shell/Prefs';
import { RootStage } from '@/components/shell/RootStage';
import { ToastProvider } from '@/components/ui';
import './globals.css';

// 전체 글꼴: Noto Sans KR (빌드 시 자체 호스팅 — 런타임 외부 CDN 요청 없음)
const noto = Noto_Sans_KR({ weight: ['400', '500', '600', '700', '800'], display: 'swap', preload: false, variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: '다색컴패니언 | DASEK COMPANION', template: '%s · 다색컴패니언' },
  description: 'Mobile-first wellness membership platform and connected business AX for Real Sicdan & Dasek Nyang.',
  robots: { index: false, follow: false }, // DEMO 단계: 검색 노출 금지
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-ax-theme="pure-white" data-font="md" className={noto.variable} suppressHydrationWarning>
      <body className="font-sans">
        <ToastProvider>
          <DeviceProvider>
            <Prefs />
            <FrameSync />
            <RootStage>{children}</RootStage>
          </DeviceProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
