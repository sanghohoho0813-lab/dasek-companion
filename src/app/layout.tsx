import type { Metadata, Viewport } from 'next';
import { DeviceProvider, FrameSync } from '@/components/device/Device';
import { Prefs } from '@/components/shell/Prefs';
import { RootStage } from '@/components/shell/RootStage';
import { ToastProvider } from '@/components/ui';
import './globals.css';

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
    <html lang="ko" data-ax-theme="pure-white" data-font="md" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
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
