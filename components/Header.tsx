'use client';
import { useState } from 'react';
import { logoutAction } from '@/app/actions/auth';

type User = { id: string; email: string; name: string } | null;

export function Header({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

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
          <a
            href="/templates/new"
            className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-700"
          >
            + New Template
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
        <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-1 bg-white">
          <a
            href="/"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Projects
          </a>
          <a
            href="/templates"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Templates
          </a>
          <a
            href="/templates/new"
            onClick={() => setOpen(false)}
            className="block w-full text-center rounded bg-slate-900 text-white px-3 py-2.5 text-sm mt-2"
          >
            + New Template
          </a>
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
