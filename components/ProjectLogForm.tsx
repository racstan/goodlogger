'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectLog, updateProjectLog } from '@/app/actions/logs';
import { validateLogValues } from '@/lib/validate';
import type { FieldDef, LogValues } from '@/lib/schema';
import { getNextIncrementerValue } from '@/lib/incrementer';
import { MediaUploadField } from '@/components/MediaUploadField';

type TemplateGroup = {
  id: string;
  name: string;
  fields: FieldDef[];
};

type Props = {
  projectId: string;
  templates: TemplateGroup[];
  nextSerial: number;
  editingLog?: { id: string; serial: number; values: LogValues } | null;
  onCancelEdit?: () => void;
  parsedLogs?: { id: string; values: LogValues; loggedAt: string; serial: number }[];
};

export function ProjectLogForm({ projectId, templates, nextSerial, editingLog, onCancelEdit, parsedLogs }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<LogValues>(() => {
    if (editingLog) return editingLog.values;
    const initial: LogValues = {};
    for (const t of templates) {
      for (const f of t.fields) {
        if (f.type === 'incrementer') {
          let lastVal: any = undefined;
          if (parsedLogs && parsedLogs.length > 0) {
            for (let i = parsedLogs.length - 1; i >= 0; i--) {
              const log = parsedLogs[i];
              if (log.values && log.values[f.id] !== undefined && log.values[f.id] !== null) {
                lastVal = log.values[f.id];
                break;
              }
            }
          }
          initial[f.id] = getNextIncrementerValue(f, lastVal);
        } else if (f.type === 'date') {
          let lastVal: any = undefined;
          if (parsedLogs && parsedLogs.length > 0) {
            for (let i = parsedLogs.length - 1; i >= 0; i--) {
              const log = parsedLogs[i];
              if (log.values && log.values[f.id] !== undefined && log.values[f.id] !== null) {
                lastVal = log.values[f.id];
                break;
              }
            }
          }
          if (lastVal) {
            initial[f.id] = lastVal;
          }
        }
      }
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dateSteps, setDateSteps] = useState<Record<string, number>>({});

  const set = (id: string, v: unknown) => setValues((p: LogValues) => ({ ...p, [id]: v as never }));

  // Collect all fields for validation
  const allFields = templates.flatMap((t) => t.fields);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate against all combined fields
    const v = validateLogValues(allFields, values);
    if (!v.success) {
      setError(v.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setPending(true);
    try {
      if (editingLog) {
        await updateProjectLog(editingLog.id, values);
        setSuccess(true);
        if (onCancelEdit) onCancelEdit();
      } else {
        await createProjectLog(projectId, values);
        const nextValues: LogValues = {};
        for (const t of templates) {
          for (const f of t.fields) {
            if (f.type === 'incrementer') {
              const currentVal = values[f.id];
              nextValues[f.id] = getNextIncrementerValue(f, currentVal);
            } else if (f.type === 'date') {
              const currentVal = values[f.id] as string;
              if (currentVal) {
                const step = dateSteps[f.id] || 0;
                const d = new Date(currentVal);
                if (!isNaN(d.getTime())) {
                  d.setUTCDate(d.getUTCDate() + step);
                  nextValues[f.id] = d.toISOString().split('T')[0];
                } else {
                  nextValues[f.id] = currentVal;
                }
              }
            }
          }
        }
        setValues(nextValues);
        setSuccess(true);
      }
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
        <h2 className="font-medium dark:text-slate-100">
          {editingLog ? `Edit Entry #${editingLog.serial}` : 'Log Entry'}
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {editingLog ? `Editing entry` : `Entry #${nextSerial}`}
        </span>
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
                  {renderInput(f, values[f.id], (v) => set(f.id, v), dateSteps, setDateSteps)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && (
          <p className="text-emerald-600 text-sm">
            {editingLog ? `Entry #${editingLog.serial} updated!` : `Entry #${nextSerial} saved!`}
          </p>
        )}

        {templates.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-emerald-600 text-white px-4 py-3 text-sm min-h-11 w-full sm:w-auto hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? 'Saving…' : (editingLog ? `Update Entry #${editingLog.serial}` : `Save Entry #${nextSerial}`)}
            </button>
            {editingLog && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm min-h-11 w-full sm:w-auto text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function SelectInput({ f, value, onChange }: { f: FieldDef & { type: 'select' }; value: unknown; onChange: (v: unknown) => void }) {
  const valStr = String(value ?? '');
  const [isOthersSelected, setIsOthersSelected] = useState(() => {
    return valStr !== '' && !f.options.includes(valStr);
  });

  const selectValue = isOthersSelected ? 'Others' : (f.options.includes(valStr) ? valStr : '');
  const inputClass = 'border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="space-y-2 w-full">
      <select
        className={inputClass}
        value={selectValue}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'Others') {
            setIsOthersSelected(true);
            onChange(''); // Let user type a custom value
          } else {
            setIsOthersSelected(false);
            onChange(val);
          }
        }}
      >
        <option value="">— select —</option>
        {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        <option value="Others">Others</option>
      </select>

      {isOthersSelected && (
        <input
          type="text"
          className={inputClass}
          placeholder="Type custom option..."
          value={valStr}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

function MultiSelectInput({ f, value, onChange }: { f: FieldDef & { type: 'multiselect' }; value: unknown; onChange: (v: unknown) => void }) {
  const arr = Array.isArray(value) ? (value as string[]) : [];
  const initialCustom = arr.find((x) => !f.options.includes(x)) ?? '';
  const [isOthersChecked, setIsOthersChecked] = useState(() => initialCustom !== '');
  const [customText, setCustomText] = useState(initialCustom);
  const inputClass = 'border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100';

  const handleOthersCheckboxChange = (checked: boolean) => {
    setIsOthersChecked(checked);
    if (!checked) {
      setCustomText('');
      onChange(arr.filter((x) => f.options.includes(x)));
    } else {
      if (customText.trim() !== '' && !arr.includes(customText)) {
        onChange([...arr, customText]);
      }
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    const cleaned = arr.filter((x) => f.options.includes(x));
    if (text.trim() !== '') {
      // Avoid duplicating if the typed text happens to match an existing option that is already selected
      if (!cleaned.includes(text)) {
        onChange([...cleaned, text]);
      } else {
        onChange(cleaned);
      }
    } else {
      onChange(cleaned);
    }
  };

  return (
    <div className="space-y-3 w-full">
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
        <label className="inline-flex items-center gap-2 text-sm py-1.5 min-h-11">
          <input
            type="checkbox"
            className="min-h-5 min-w-5"
            checked={isOthersChecked}
            onChange={(e) => handleOthersCheckboxChange(e.target.checked)}
          />
          Others
        </label>
      </div>

      {isOthersChecked && (
        <input
          type="text"
          className={inputClass}
          placeholder="Type custom option..."
          value={customText}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

function renderInput(
  f: FieldDef,
  value: unknown,
  onChange: (v: unknown) => void,
  dateSteps?: Record<string, number>,
  setDateSteps?: React.Dispatch<React.SetStateAction<Record<string, number>>>
): React.ReactElement {
  const inputClass = 'border border-slate-300 dark:border-slate-600 rounded px-3 py-2.5 w-full min-h-11 text-sm dark:bg-slate-800 dark:text-slate-100';
  switch (f.type) {
    case 'text':
      return <input type="text" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'richtext':
      return <textarea className={`${inputClass} min-h-[100px]`} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'boolean':
      return (
        <div className="flex items-center gap-6 py-2 min-h-11">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              className="min-h-5 min-w-5 text-emerald-600 focus:ring-emerald-500"
              name={`boolean-${f.id}`}
              checked={value === true}
              onChange={() => onChange(true)}
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              className="min-h-5 min-w-5 text-emerald-600 focus:ring-emerald-500"
              name={`boolean-${f.id}`}
              checked={value === false}
              onChange={() => onChange(false)}
            />
            <span>No</span>
          </label>
        </div>
      );
    case 'date': {
      const stepVal = dateSteps?.[f.id] ?? 0;
      return (
        <div className="space-y-2">
          <input type="date" className={inputClass} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Auto-increment next entry by (days):
            </label>
            <input
              type="number"
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 text-sm dark:bg-slate-800 dark:text-slate-100"
              value={stepVal}
              onChange={(e) => {
                const s = parseInt(e.target.value, 10);
                if (setDateSteps) {
                  setDateSteps(prev => ({ ...prev, [f.id]: isNaN(s) ? 0 : s }));
                }
              }}
            />
          </div>
        </div>
      );
    }
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
      return <SelectInput f={f as any} value={value} onChange={onChange} />;
    case 'multiselect':
      return <MultiSelectInput f={f as any} value={value} onChange={onChange} />;
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
    case 'incrementer': {
      const incVal = (value as any) || { value: '' };
      if (f.incType === 'date') {
        const stepVal = typeof incVal.step === 'number' ? incVal.step : (f.dateStep ?? 1);
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculated Date:</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {incVal.value || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Step (days) for next increment:
              </label>
              <input
                type="number"
                min={1}
                className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 text-sm dark:bg-slate-800 dark:text-slate-100"
                value={stepVal}
                onChange={(e) => {
                  const s = parseInt(e.target.value, 10);
                  onChange({
                    ...incVal,
                    step: isNaN(s) || s < 1 ? 1 : s
                  });
                }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Next Value ({f.incType}):
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {incVal.value || '—'}
            </span>
          </div>
        );
      }
    }
    case 'image':
    case 'audio':
    case 'video':
      return <MediaUploadField f={f as any} value={value} onChange={onChange} />;
  }
}
