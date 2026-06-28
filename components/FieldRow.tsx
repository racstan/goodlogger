'use client';
import type { FieldDef, FieldType } from '@/lib/schema';

const TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'slider', label: 'Slider' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'phone', label: 'Phone' },
  { value: 'color', label: 'Color' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'rating', label: 'Rating (stars)' },
  { value: 'incrementer', label: 'Incrementer' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
];

type Props = {
  field: FieldDef;
  index: number;
  onChange: (f: FieldDef) => void;
  onRemove: () => void;
};

export function FieldRow({ field, index, onChange, onRemove }: Props) {
  const update = (patch: Partial<FieldDef>) => onChange({ ...field, ...patch } as FieldDef);

  return (
    <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-slate-400 dark:text-slate-500 text-sm w-6 shrink-0">#{index + 1}</span>
          <input
            aria-label="Field name"
            className="border border-slate-300 dark:border-slate-600 rounded px-2 py-2 text-sm flex-1 min-w-0 min-h-11 sm:min-h-0 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Field name"
            value={field.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Field type"
            className="border border-slate-300 dark:border-slate-600 rounded px-2 py-2 text-sm flex-1 min-h-11 sm:min-h-0 dark:bg-slate-800 dark:text-slate-100"
            value={field.type}
            onChange={(e) => {
              const t = e.target.value as FieldType;
              onChange(makeField(t, field.name, field.required));
            }}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => update({ required: e.target.checked })}
              className="min-h-4 min-w-4"
            />
            Required
          </label>
          <button
            type="button"
            aria-label="Remove field"
            onClick={onRemove}
            className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 min-h-11 sm:min-h-0"
          >
            Remove
          </button>
        </div>
      </div>

      {(field.type === 'select' || field.type === 'multiselect') && (
        <div className="space-y-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Options</label>
          {field.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 w-5 text-right shrink-0">{i + 1}.</span>
              <input
                aria-label={`Option ${i + 1}`}
                className="border border-slate-300 dark:border-slate-600 rounded px-2 py-2 text-sm flex-1 min-w-0 min-h-11 dark:bg-slate-800 dark:text-slate-100"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const updated = [...field.options];
                  updated[i] = e.target.value;
                  update({ options: updated } as Partial<FieldDef>);
                }}
              />
              <button
                type="button"
                aria-label={`Remove option ${i + 1}`}
                onClick={() => {
                  const updated = field.options.filter((_, idx) => idx !== i);
                  update({ options: updated.length > 0 ? updated : [''] } as Partial<FieldDef>);
                }}
                className="text-red-400 hover:text-red-600 text-lg font-bold px-2 min-h-11 min-w-11 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ options: [...field.options, ''] } as Partial<FieldDef>)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 min-h-11"
          >
            <span className="text-lg leading-none">+</span> Add option
          </button>
        </div>
      )}

      {field.type === 'slider' && (
        <div className="flex gap-2 pl-8 text-sm flex-wrap">
          <label>min <input type="number" className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 dark:bg-slate-800 dark:text-slate-100" value={field.min} onChange={(e) => update({ min: Number(e.target.value) } as Partial<FieldDef>)} /></label>
          <label>max <input type="number" className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 dark:bg-slate-800 dark:text-slate-100" value={field.max} onChange={(e) => update({ max: Number(e.target.value) } as Partial<FieldDef>)} /></label>
          <label>step <input type="number" step="any" className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 dark:bg-slate-800 dark:text-slate-100" value={field.step} onChange={(e) => update({ step: Number(e.target.value) } as Partial<FieldDef>)} /></label>
        </div>
      )}

      {field.type === 'rating' && (
        <div className="flex gap-2 pl-8 text-sm">
          <label>max stars <input type="number" className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 dark:bg-slate-800 dark:text-slate-100" value={field.max ?? 5} onChange={(e) => update({ max: Number(e.target.value) } as Partial<FieldDef>)} /></label>
        </div>
      )}

      {field.type === 'incrementer' && (
        <div className="pl-8 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Subtype:</span>
            <select
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-100"
              value={field.incType}
              onChange={(e) => update({ incType: e.target.value as any } as Partial<FieldDef>)}
            >
              <option value="number">Number (0, 1, 2...)</option>
              <option value="character">Character (a-z loop)</option>
              <option value="date">Date & Day Incrementer</option>
              <option value="sequence">Sequence Loop</option>
            </select>
          </div>

          {field.incType === 'character' && (
            <div className="flex items-center gap-2">
              <label>
                Starting character:
                <input
                  type="text"
                  maxLength={1}
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-16 ml-2 dark:bg-slate-800 dark:text-slate-100"
                  value={field.startChar ?? 'a'}
                  onChange={(e) => update({ startChar: e.target.value } as Partial<FieldDef>)}
                />
              </label>
            </div>
          )}

          {field.incType === 'date' && (
            <div className="flex flex-wrap gap-3">
              <label>
                Starting date:
                <input
                  type="date"
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 ml-2 dark:bg-slate-800 dark:text-slate-100"
                  value={field.startDate ?? ''}
                  onChange={(e) => update({ startDate: e.target.value } as Partial<FieldDef>)}
                />
              </label>
              <label>
                Default step (days):
                <input
                  type="number"
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-20 ml-2 dark:bg-slate-800 dark:text-slate-100"
                  value={field.dateStep ?? 1}
                  onChange={(e) => update({ dateStep: Number(e.target.value) } as Partial<FieldDef>)}
                />
              </label>
            </div>
          )}

          {field.incType === 'sequence' && (
            <div className="space-y-1">
              <label className="block">Sequence items (separated by commas or arrows `-&gt;`):</label>
              <textarea
                className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-full h-16 dark:bg-slate-800 dark:text-slate-100"
                placeholder="e.g. ant -> rabbit -> potato"
                value={field.sequence ?? ''}
                onChange={(e) => update({ sequence: e.target.value } as Partial<FieldDef>)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function makeField(type: FieldType, name = '', required = false): FieldDef {
  const id = 'f_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  switch (type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
    case 'email':
    case 'url':
    case 'phone':
    case 'color':
    case 'richtext':
    case 'image':
    case 'audio':
    case 'video':
      return { id, name, type, required };
    case 'boolean':
      return { id, name, type: 'boolean', required };
    case 'select':
    case 'multiselect':
      return { id, name, type, required, options: [] };
    case 'slider':
      return { id, name, type: 'slider', required, min: 0, max: 10, step: 1 };
    case 'rating':
      return { id, name, type: 'rating', required, max: 5 };
    case 'incrementer':
      return { id, name, type: 'incrementer', required, incType: 'number', startChar: 'a', startDate: '', dateStep: 1, sequence: '' };
  }
}
