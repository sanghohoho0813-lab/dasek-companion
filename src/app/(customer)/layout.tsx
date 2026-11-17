import { CustomerShell } from '@/components/customer/Shell';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
