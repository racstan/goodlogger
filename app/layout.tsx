import './globals.css';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          <Header user={user} />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
