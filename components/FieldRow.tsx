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
    <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-slate-400 text-sm w-6 shrink-0">#{index + 1}</span>
          <input
            aria-label="Field name"
            className="border border-slate-300 rounded px-2 py-2 text-sm flex-1 min-w-0 min-h-11 sm:min-h-0"
            placeholder="Field name"
            value={field.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Field type"
            className="border border-slate-300 rounded px-2 py-2 text-sm flex-1 min-h-11 sm:min-h-0"
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
          <label className="flex items-center gap-1 text-sm text-slate-600 whitespace-nowrap shrink-0">
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
        <textarea
          aria-label="Options"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
          placeholder="One option per line (or comma-separated)"
          rows={3}
          value={field.options.join('\n')}
          onChange={(e) => update({ options: parseOptions(e.target.value) } as Partial<FieldDef>)}
        />
      )}

      {field.type === 'slider' && (
        <div className="flex gap-2 pl-8 text-sm flex-wrap">
          <label>min <input type="number" className="border border-slate-300 rounded px-2 py-1 w-20" value={field.min} onChange={(e) => update({ min: Number(e.target.value) } as Partial<FieldDef>)} /></label>
          <label>max <input type="number" className="border border-slate-300 rounded px-2 py-1 w-20" value={field.max} onChange={(e) => update({ max: Number(e.target.value) } as Partial<FieldDef>)} /></label>
          <label>step <input type="number" step="any" className="border border-slate-300 rounded px-2 py-1 w-20" value={field.step} onChange={(e) => update({ step: Number(e.target.value) } as Partial<FieldDef>)} /></label>
        </div>
      )}

      {field.type === 'rating' && (
        <div className="flex gap-2 pl-8 text-sm">
          <label>max stars <input type="number" className="border border-slate-300 rounded px-2 py-1 w-20" value={field.max ?? 5} onChange={(e) => update({ max: Number(e.target.value) } as Partial<FieldDef>)} /></label>
        </div>
      )}
    </div>
  );
}

function parseOptions(raw: string): string[] {
  return raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
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
      return { id, name, type, required };
    case 'boolean':
      return { id, name, type: 'boolean', required };
    case 'select':
    case 'multiselect':
      return { id, name, type, required, options: ['Option 1'] };
    case 'slider':
      return { id, name, type: 'slider', required, min: 0, max: 10, step: 1 };
    case 'rating':
      return { id, name, type: 'rating', required, max: 5 };
  }
}
