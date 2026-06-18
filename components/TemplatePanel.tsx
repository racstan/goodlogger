'use client';
import { useTransition, useState } from 'react';
import { importTemplate, removeTemplate } from '@/app/actions/projects';
import type { FieldDef } from '@/lib/schema';

type Props = {
  projectId: string;
  importedTemplates: {
    id: string;
    name: string;
    fields: FieldDef[];
    logCount: number;
  }[];
  availableTemplates: { id: string; name: string; fieldCount: number }[];
};

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-sm font-medium min-h-11"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {subtitle && <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{subtitle}</span>}
          <span className="text-slate-400 dark:text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

export function TemplatePanel({ projectId, importedTemplates, availableTemplates }: Props) {
  const [pending, start] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleImport = (templateId: string) => {
    start(async () => {
      await importTemplate(projectId, templateId);
    });
    setShowDropdown(false);
  };

  const handleRemove = (templateId: string) => {
    if (!confirm('Remove this template from the project? (The template itself is not deleted.)')) return;
    start(async () => {
      await removeTemplate(projectId, templateId);
    });
  };

  return (
    <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="font-medium text-sm">Templates</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={pending || availableTemplates.length === 0}
            className="rounded bg-emerald-600 text-white px-4 py-2 text-sm min-h-11 hover:bg-emerald-700 disabled:opacity-50"
          >
            + Add Template
          </button>
          {showDropdown && (
            <div className="fixed sm:absolute right-4 sm:right-0 top-auto sm:top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50 min-w-[250px] max-h-[300px] overflow-y-auto left-4 sm:left-auto">
              {availableTemplates.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">All templates already imported</div>
              ) : (
                availableTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleImport(t.id)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between min-h-11"
                  >
                    <span>{t.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">{t.fieldCount} fields</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {importedTemplates.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No templates imported yet. Use the button above to add one.
          </div>
        ) : (
          importedTemplates.map((t) => (
            <div key={t.id} className="relative">
              <CollapsibleSection
                title={t.name}
                subtitle={`${t.fields.length} fields · ${t.logCount} entries`}
                defaultOpen={false}
              >
                <div className="space-y-2">
                  {t.fields.map((f) => (
                    <div key={f.id} className="flex items-baseline gap-2 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{f.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {f.type === 'slider' ? `(${f.min}–${f.max})`
                          : f.type === 'select' || f.type === 'multiselect' ? `(${f.options.join(', ')})`
                          : f.type === 'rating' ? `(0–${f.max ?? 5})`
                          : `(${f.type})`}
                      </span>
                      {f.required && <span className="text-red-500 text-xs">required</span>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
              <button
                type="button"
                onClick={() => handleRemove(t.id)}
                disabled={pending}
                className="absolute top-2 right-3 text-slate-400 dark:text-slate-500 hover:text-red-600 font-bold text-sm leading-none z-10"
                title="Remove from project"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
