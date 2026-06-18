'use server';

import { redirect } from 'next/navigation';
import { createUser, loginUser, logout } from '@/lib/auth';

export async function registerAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !name || !password) {
    return { error: 'All fields are required' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }
  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  const result = await createUser(email, name, password);
  if ('error' in result) return { error: result.error };

  redirect('/');
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const keepSignedIn = formData.get('keepSignedIn') === 'on';

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const result = await loginUser(email, password, keepSignedIn);
  if ('error' in result) return { error: result.error };

  redirect('/');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}
