import type { Metadata } from 'next';
import { AxShell } from '@/components/ax/Shell';

export const metadata: Metadata = { title: '운영 AX' };

export default function AxLayout({ children }: { children: React.ReactNode }) {
  return <AxShell>{children}</AxShell>;
}
