import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          <main className="min-h-screen flex items-center justify-center px-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
