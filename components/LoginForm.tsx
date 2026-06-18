'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100"
          placeholder="••••••"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          name="keepSignedIn"
          className="min-h-4 min-w-4"
        />
        Keep me signed in
      </label>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 text-sm min-h-11 w-full hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
