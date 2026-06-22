import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { RegisterForm } from '@/components/RegisterForm';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <a href="/" className="text-2xl font-bold tracking-tight">goodlogger</a>
        <h1 className="text-xl font-semibold mt-4">Create account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start logging your data</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
