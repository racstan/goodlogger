'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/app/actions/projects';

export function ProjectForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Project name is required'); return; }
    setPending(true);
    try {
      const fd = new FormData();
      fd.set('name', name.trim());
      fd.set('description', description.trim());
      await createProject(fd);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded border border-slate-200 bg-white p-4 space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="border border-slate-300 rounded px-3 py-2 text-sm min-h-11 flex-1 min-w-0"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
        />
        <input
          className="border border-slate-300 rounded px-3 py-2 text-sm min-h-11 flex-1 min-w-0"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <button type="submit" disabled={pending} className="rounded bg-slate-900 text-white px-4 py-2 text-sm min-h-11 hover:bg-slate-700 disabled:opacity-50">
          {pending ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
