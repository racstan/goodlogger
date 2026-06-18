'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="border border-slate-300 rounded px-3 py-2.5 w-full min-h-11 text-sm"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-slate-300 rounded px-3 py-2.5 w-full min-h-11 text-sm"
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
          minLength={6}
          autoComplete="new-password"
          className="border border-slate-300 rounded px-3 py-2.5 w-full min-h-11 text-sm"
          placeholder="At least 6 characters"
        />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 text-white px-4 py-3 text-sm min-h-11 w-full hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  );
}
