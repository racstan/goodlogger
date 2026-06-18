'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function LogsFilter({ templateId }: { templateId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');

  useEffect(() => {
    setFrom(params.get('from') ?? '');
    setTo(params.get('to') ?? '');
  }, [params]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    router.push(`/templates/${templateId}/logs${q.toString() ? `?${q}` : ''}`);
  };

  const clear = () => {
    setFrom('');
    setTo('');
    router.push(`/templates/${templateId}/logs`);
  };

  return (
    <form onSubmit={apply} className="flex items-end gap-2 flex-wrap">
      <label className="text-sm w-full sm:w-auto">
        From
        <input type="date" className="ml-1 border border-slate-300 rounded px-2 py-1.5 w-full sm:w-auto min-h-11 sm:min-h-0" value={from} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label className="text-sm w-full sm:w-auto">
        To
        <input type="date" className="ml-1 border border-slate-300 rounded px-2 py-1.5 w-full sm:w-auto min-h-11 sm:min-h-0" value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <div className="flex gap-2 w-full sm:w-auto">
        <button type="submit" className="flex-1 sm:flex-none rounded bg-slate-900 text-white px-4 py-2 text-sm min-h-11">Apply</button>
        <button type="button" onClick={clear} className="flex-1 sm:flex-none rounded border border-slate-300 px-4 py-2 text-sm min-h-11">Clear</button>
      </div>
    </form>
  );
}
