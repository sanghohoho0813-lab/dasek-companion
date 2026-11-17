'use client';
import { usePathname } from 'next/navigation';
import { DeviceStage } from '@/components/device/Device';

export function RootStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const label = pathname.startsWith('/ax') ? '운영 AX' : '고객 플랫폼';
  return <DeviceStage label={label}>{children}</DeviceStage>;
}
