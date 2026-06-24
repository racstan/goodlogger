'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FieldRow, makeField } from './FieldRow';
import { validateFieldDef, type FieldDef } from '@/lib/schema';
import { createTemplate, updateTemplate } from '@/app/actions/templates';

type Props = {
  templateId?: string;
  initialName?: string;
  initialDescription?: string;
  initialFields?: FieldDef[];
  hasLogs?: boolean;
};

export function TemplateDesigner({ templateId, initialName = '', initialDescription = '', initialFields = [], hasLogs = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FieldDef[]>(
    initialFields.length > 0 ? initialFields : [makeField('text', 'Field 1')]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const addField = () => setFields((f) => [...f, makeField('text', `Field ${f.length + 1}`)]);

  const updateField = (i: number, def: FieldDef) =>
    setFields((arr) => arr.map((f, idx) => (idx === i ? def : f)));

  const removeField = (i: number) => setFields((arr) => arr.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Template name is required'); return; }
    const seen = new Set<string>();
    for (const f of fields) {
      const key = f.name.trim().toLowerCase();
      if (!key) { setError('All fields need a name'); return; }
      if (seen.has(key)) { setError(`Duplicate field name: "${f.name}"`); return; }
      seen.add(key);
      const v = validateFieldDef(f);
      if (!v.ok) { setError(v.error); return; }
    }

    const fd = new FormData();
    fd.set('name', name.trim());
    fd.set('description', description.trim());
    fd.set('fields', JSON.stringify(fields));
    setPending(true);
    try {
      if (templateId) await updateTemplate(templateId, fd);
      else await createTemplate(fd);
    } catch (err) {
      // Next.js redirect throws a special error; let it propagate
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
      router.refresh();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {hasLogs && (
        <div className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Heads up: this template has existing entries (direct or via projects that imported it). Changing or removing fields will cause older entries to show '—' for affected columns.
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Template name</label>
        <input
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 w-full dark:bg-slate-800 dark:text-slate-100"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily Standup"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
        <input
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 w-full dark:bg-slate-800 dark:text-slate-100"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this template for?"
        />
      </div>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <FieldRow
            key={f.id}
            index={i}
            field={f}
            onChange={(d) => updateField(i, d)}
            onRemove={() => removeField(i)}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button type="button" onClick={addField} className="rounded border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm min-h-11 hover:bg-slate-50 dark:hover:bg-slate-700">
          + Add Field
        </button>
        <button type="submit" disabled={pending} className="rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-sm min-h-11 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50">
          {pending ? 'Saving…' : (templateId ? 'Save Changes' : 'Create Template')}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
