import './globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'goodlogger',
  description: 'Custom data-logging templates and CSV export',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Root layout: provides html/body/ThemeProvider only.
// Header is added by (main)/layout.tsx so auth pages stay clean.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
