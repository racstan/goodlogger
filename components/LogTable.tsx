'use client';
import { useMemo, useState } from 'react';
import type { FieldDef, LogValue } from '@/lib/schema';
import { DeleteButton } from './DeleteButton';

export type LogRow = {
  id: string;
  values: Record<string, LogValue>;
  loggedAt: string; // ISO
};

type Props = { templateId: string; fields: FieldDef[]; rows: LogRow[] };

type SortKey = string; // field id or 'loggedAt'
type SortDir = 'asc' | 'desc';

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null || a === '') return 1;
  if (b === undefined || b === null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

export function LogTable({ templateId, fields, rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('loggedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === 'loggedAt' ? a.loggedAt : a.values[sortKey];
      const bv = sortKey === 'loggedAt' ? b.loggedAt : b.values[sortKey];
      return sortDir === 'asc' ? compare(av, bv) : -compare(av, bv);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  };

  if (rows.length === 0) {
    return (
      <p className="text-slate-500">
        No entries yet.{' '}
        <a className="underline" href={`/templates/${templateId}/log`}>Log your first entry</a>.
      </p>
    );
  }

  const renderCell = (f: FieldDef, v: unknown) => {
    if (v === undefined || v === null) return '—';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  return (
    <>
      {/* ─── Mobile card view (< md) ─── */}
      <div className="md:hidden space-y-3">
        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <select
            className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 min-h-11 bg-white"
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setSortDir('asc'); }}
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
            <option value="loggedAt">Logged At</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="border border-slate-300 rounded px-3 py-2 text-sm min-h-11 bg-white hover:bg-slate-50"
          >
            {sortDir === 'asc' ? '↑ A→Z' : '↓ Z→A'}
          </button>
        </div>

        {sorted.map((r) => (
          <div key={r.id} className="rounded border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {new Date(r.loggedAt).toLocaleString()}
              </span>
              <DeleteButton target={{ kind: 'log', id: r.id, templateId }} />
            </div>
            {fields.map((f) => (
              <div key={f.id} className="flex items-baseline gap-2 text-sm">
                <span className="text-slate-500 shrink-0 w-28 truncate">{f.name}:</span>
                <span className="font-medium break-words min-w-0">{renderCell(f, r.values[f.id])}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ─── Desktop table view (md+) ─── */}
      <div className="hidden md:block overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="px-3 py-2 text-left font-medium cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggle(f.id)}
                >
                  {f.name} {sortKey === f.id ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
              <th
                className="px-3 py-2 text-left font-medium cursor-pointer select-none whitespace-nowrap"
                onClick={() => toggle('loggedAt')}
              >
                Logged At {sortKey === 'loggedAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                {fields.map((f) => (
                  <td key={f.id} className="px-3 py-2 align-top">{renderCell(f, r.values[f.id])}</td>
                ))}
                <td className="px-3 py-2 align-top text-slate-600 whitespace-nowrap">{new Date(r.loggedAt).toLocaleString()}</td>
                <td className="px-3 py-2 align-top">
                  <DeleteButton target={{ kind: 'log', id: r.id, templateId }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
