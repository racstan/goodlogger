'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTemplate } from '@/app/actions/templates';
import { deleteLog } from '@/app/actions/logs';
import { deleteProject } from '@/app/actions/projects';

type Target =
  | { kind: 'template'; id: string; name: string; logCount: number }
  | { kind: 'log'; id: string; templateId?: string; returnPath?: string }
  | { kind: 'project'; id: string; name: string; templateCount: number };

export function DeleteButton({ target, className = '' }: { target: Target; className?: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const message =
    target.kind === 'template'
      ? `Delete "${target.name}" and its ${target.logCount} entries? This cannot be undone.`
      : target.kind === 'project'
      ? `Delete project "${target.name}" and remove its ${target.templateCount} template associations? (Templates themselves are not deleted.)`
      : 'Delete this entry?';

  const onClick = async () => {
    if (!confirm(message)) return;
    setPending(true);
    try {
      if (target.kind === 'template') await deleteTemplate(target.id);
      else if (target.kind === 'project') await deleteProject(target.id);
      else await deleteLog(target.id, target.returnPath);
      router.refresh();
    } catch (err) {
      // Next.js redirect throws inside server actions; ignore it
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
      console.error('Delete failed:', err);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 min-h-11 sm:min-h-0 ${className}`}
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}
