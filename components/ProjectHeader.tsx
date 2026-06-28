'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateProject } from '@/app/actions/projects';

export function ProjectHeader({
  project,
}: {
  project: { id: string; name: string; description: string | null };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <div className="min-w-0 flex-1 bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
        <form
          action={async (fd) => {
            setError(null);
            setPending(true);
            try {
              await updateProject(project.id, fd);
              setIsEditing(false);
            } catch (err: any) {
              setError(err.message);
            } finally {
              setPending(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Project Name</label>
            <input
              name="name"
              defaultValue={project.name}
              required
              autoFocus
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm w-full dark:bg-slate-700 dark:text-slate-100 min-h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description (Optional)</label>
            <textarea
              name="description"
              defaultValue={project.description || ''}
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm w-full dark:bg-slate-700 dark:text-slate-100 min-h-20"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 min-h-11 disabled:opacity-50"
            >
              {pending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setIsEditing(false)}
              className="border border-slate-300 dark:border-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 min-h-11 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <Link
        href="/"
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 inline-block mb-1"
      >
        &larr; Projects
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold break-words dark:text-slate-100">
          {project.name}
        </h1>
        <button
          onClick={() => setIsEditing(true)}
          className="text-slate-400 hover:text-emerald-600 text-sm p-1"
          title="Edit Project"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      {project.description && (
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
          {project.description}
        </p>
      )}
    </div>
  );
}
