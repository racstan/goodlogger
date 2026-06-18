'use client';
import { useTransition } from 'react';
import { importTemplate, removeTemplate } from '@/app/actions/projects';

type Props = {
  projectId: string;
  templateId: string;
  action: 'import' | 'remove';
  label?: string;
};

export function ImportTemplateButton({ projectId, templateId, action, label }: Props) {
  const [pending, start] = useTransition();

  const handleClick = () => {
    const msg = action === 'import'
      ? 'Import this template into the project?'
      : 'Remove this template from the project? (The template itself is not deleted.)';
    if (!confirm(msg)) return;
    start(async () => {
      if (action === 'import') await importTemplate(projectId, templateId);
      else await removeTemplate(projectId, templateId);
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={`rounded px-3 py-1.5 text-sm disabled:opacity-50 ${
        action === 'import'
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {pending ? '…' : (label ?? (action === 'import' ? 'Import' : 'Remove'))}
    </button>
  );
}
