'use client';
import { useTransition } from 'react';
import { deleteTemplate } from '@/app/actions/templates';
import { deleteLog } from '@/app/actions/logs';
import { deleteProject } from '@/app/actions/projects';

type Target =
  | { kind: 'template'; id: string; name: string; logCount: number }
  | { kind: 'log'; id: string; templateId?: string; returnPath?: string }
  | { kind: 'project'; id: string; name: string; templateCount: number };

export function DeleteButton({ target, className = '' }: { target: Target; className?: string }) {
  const [pending, start] = useTransition();

  const message =
    target.kind === 'template'
      ? `Delete "${target.name}" and its ${target.logCount} entries? This cannot be undone.`
      : target.kind === 'project'
      ? `Delete project "${target.name}" and remove its ${target.templateCount} template associations? (Templates themselves are not deleted.)`
      : 'Delete this entry?';

  const onClick = () => {
    if (!confirm(message)) return;
    start(async () => {
      if (target.kind === 'template') await deleteTemplate(target.id);
      else if (target.kind === 'project') await deleteProject(target.id);
      else await deleteLog(target.id, target.returnPath);
    });
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
