import './globals.css';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'goodlogger',
  description: 'Custom data-logging templates and CSV export',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header user={user} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
