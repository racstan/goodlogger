'use client';
import { useState } from 'react';
import { logoutAction } from '@/app/actions/auth';
import { useTheme } from './ThemeProvider';

type User = { id: string; email: string; name: string } | null;

export function Header({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <a href="/" className="font-semibold text-lg shrink-0">goodlogger</a>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-4 text-sm">
          <a href="/" className="text-slate-600 hover:text-slate-900">Projects</a>
          <a href="/templates" className="text-slate-600 hover:text-slate-900">Templates</a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex ml-auto items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <a
            href="/settings"
            className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Settings
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/login"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign In
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden ml-auto p-2 min-h-11 min-w-11 flex items-center justify-center rounded hover:bg-slate-100"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 px-4 py-3 space-y-1 bg-white dark:bg-slate-900">
          <a
            href="/"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Projects
          </a>
          <a
            href="/templates"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Templates
          </a>

          <a
            href="/settings"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Settings
          </a>
          <button
            type="button"
            onClick={() => { toggle(); setOpen(false); }}
            className="w-full text-left rounded px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          {user ? (
            <>
              <div className="px-3 py-2 text-xs text-slate-400">{user.email}</div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full text-center rounded border border-slate-300 px-3 py-2.5 text-sm text-slate-600"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center rounded border border-slate-300 px-3 py-2.5 text-sm text-slate-600 mt-2"
            >
              Sign In
            </a>
          )}
        </div>
      )}
    </header>
  );
}
