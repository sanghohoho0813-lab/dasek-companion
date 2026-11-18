'use client';
import { usePathname } from 'next/navigation';
import { DeviceStage } from '@/components/device/Device';

export function RootStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 발표용 시연 모드는 자체 화면(고객·AX 동시 표시)이 있어 Device View 로 감싸지 않는다
  if (pathname.startsWith('/demo')) return <>{children}</>;
  const label = pathname.startsWith('/ax') ? '운영 AX' : '고객 플랫폼';
  return <DeviceStage label={label}>{children}</DeviceStage>;
}
