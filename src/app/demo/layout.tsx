import type { Metadata } from 'next';

export const metadata: Metadata = { title: '발표용 시연' };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
