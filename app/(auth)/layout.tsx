import type { ReactNode } from 'react';

// Auth layout: full-screen centered, NO html/body (root layout provides those),
// NO header — login/register pages are standalone.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {children}
    </main>
  );
}
