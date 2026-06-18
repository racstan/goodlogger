'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectLog } from '@/app/actions/logs';
import { validateLogValues } from '@/lib/validate';
import type { FieldDef, LogValues } from '@/lib/schema';

type TemplateGroup = {
  id: string;
  name: string;
  fields: FieldDef[];
};

type Props = {
  projectId: string;
  templates: TemplateGroup[];
  nextSerial: number;
};

function defaultValue(def: FieldDef): unknown {
  switch (def.type) {
    case 'text':
    case 'richtext':
    case 'date':
    case 'time':
    case 'email':
    case 'url':
    case 'phone':
    case 'select':
      return '';
    case 'color':
      return '#000000';
    case 'number':
      return '';
    case 'boolean':
      return false;
    case 'multiselect':
      return [];
    case 'slider':
      return Math.round(((def.min + def.max) / 2) / def.step) * def.step;
    case 'rating':
      return 0;
  }
}

export function ProjectLogForm({ projectId, templates, nextSerial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<LogValues>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (id: string, v: unknown) => setValues((p: LogValues) => ({ ...p, [id]: v as never }));

  // Collect all fields for validation
  const allFields = templates.flatMap((t) => t.fields);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate against all combined fields
    const v = validateLogValues(allFields, values);
    if (!v.success) { setError(v.error.issues[0]?.message ?? 'Invalid input'); return; }

    setPending(true);
    try {
      await createProjectLog(projectId, values);
      setValues({});
      setSuccess(true);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h2 className="font-medium dark:text-slate-100">Log Entry</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Entry #{nextSerial}</span>
      </div>

      <form onSubmit={submit} className="p-4 space-y-6">
        {templates.map((tmpl) => (
          <div key={tmpl.id}>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">
              {tmpl.name}
            </h3>
            <div className="space-y-4">
              {tmpl.fields.map((f) => (
                <div key={f.id} className="rounded border border-slate-200 dark:border-slate-700 p-3">
                  <label className="block text-sm font-medium mb-1">
                    {f.name}{f.required && <span className="text-red-600"> *</span>}
                  </label>
                  {renderInput(f, values[f.id], (v) => set(f.id, v))}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-600 text-sm">Entry #{nextSerial} saved!</p>}

        {templates.length > 0 && (
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-emerald-600 text-white px-4 py-3 text-sm min-h-11 w-full sm:w-auto hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Saving…' : `Save Entry #${nextSerial}`}
          </button>
        )}
      </form>
    </div>
  );
}

function renderInput(f: FieldDef, value: unknown, onChange: (v: unknown) => void): React.ReactElement {
  const inputClass = 'border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100';
  switch (f.type) {
    case 'text':
      return <input type="text" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'richtext':
      return <textarea className={`${inputClass} min-h-[100px]`} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'boolean':
      return <label className="inline-flex items-center gap-3 py-2 min-h-11"><input type="checkbox" className="min-h-5 min-w-5" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> <span className="text-sm">Yes</span></label>;
    case 'date':
      return <input type="date" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'time':
      return <input type="time" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'email':
      return <input type="email" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'url':
      return <input type="url" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />;
    case 'phone':
      return <input type="tel" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder="+1 555-0123" />;
    case 'color':
      return (
        <div className="flex items-center gap-3">
          <input type="color" className="h-10 w-14 cursor-pointer shrink-0" value={String(value ?? '#000000')} onChange={(e) => onChange(e.target.value)} />
          <input type="text" className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 min-h-11 text-sm w-full dark:bg-slate-800 dark:text-slate-100" value={String(value ?? '#000000')} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
        </div>
      );
    case 'select':
      return (
        <select className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">— select —</option>
          {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-3">
          {f.options.map((o: string) => (
            <label key={o} className="inline-flex items-center gap-2 text-sm py-1.5 min-h-11">
              <input
                type="checkbox"
                className="min-h-5 min-w-5"
                checked={arr.includes(o)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...arr, o]);
                  else onChange(arr.filter((x) => x !== o));
                }}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case 'slider':
      return (
        <div className="flex items-center gap-4">
          <input type="range" min={f.min} max={f.max} step={f.step} value={Number(value ?? f.min)} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 min-h-11" />
          <span className="font-mono text-sm w-12 text-right shrink-0">{String(value ?? f.min)}</span>
        </div>
      );
    case 'rating': {
      const max = f.max ?? 5;
      const current = Number(value ?? 0);
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="text-3xl leading-none p-1 min-h-11 min-w-11 flex items-center justify-center"
            >
              {i < current ? '★' : '☆'}
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{current}/{max}</span>
        </div>
      );
    }
  }
}
