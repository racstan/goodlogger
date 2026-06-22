import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';

// Main app layout: adds the Header nav for all authenticated pages.
export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
