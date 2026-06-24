'use client';

import { useState } from 'react';
import { Calendar } from './Calendar';
import { ActivityPanel } from './ActivityPanel';
import type { FieldDef } from '@/lib/schema';

type LogDate = { date: string; count: number };

type LogEntry = {
  id: string;
  values: Record<string, unknown>;
  loggedAt: string;
  projectName: string | null;
  projectId: string | null;
};

type FieldGroup = { projectName: string; fields: FieldDef[] };

type Props = {
  logDates: LogDate[];
  recentLogs: LogEntry[];
  allFields: FieldGroup[];
};

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )},
  { id: 'activity', label: 'Activity', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )},
] as const;

type TabId = typeof TABS[number]['id'];

export function Dashboard({ logDates, recentLogs, allFields }: Props) {
  const [tab, setTab] = useState<TabId>('calendar');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Fixed window container */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium min-h-12 transition-colors
                ${tab === t.id
                  ? 'border-b-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }
              `}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Fixed content window */}
        <div className="h-[500px] overflow-y-auto p-4">
          {tab === 'calendar' && <Calendar logDates={logDates} />}
          {tab === 'activity' && <ActivityPanel logs={recentLogs} allFields={allFields} />}
        </div>
      </div>
    </div>
  );
}
