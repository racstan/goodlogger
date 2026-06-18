'use client';

import { useState } from 'react';

type LogDate = {
  date: string; // YYYY-MM-DD
  count: number;
};

type Props = {
  logDates: LogDate[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Calendar({ logDates }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const logMap = new Map(logDates.map((d) => [d.date, d.count]));
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else { setMonth(month - 1); }
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else { setMonth(month + 1); }
  };

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className="font-medium text-sm">
          {MONTHS[month]} {year}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 dark:text-slate-500">
        {DAYS.map((d) => (
          <div key={d} className="py-1">{d.slice(0, 2)}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = formatDate(year, month, day);
          const count = logMap.get(dateStr) ?? 0;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          return (
            <div
              key={day}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded text-sm
                ${isToday ? 'ring-2 ring-slate-900 dark:ring-slate-100 font-bold' : ''}
                ${count > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-400'}
              `}
              title={count > 0 ? `${count} log${count === 1 ? '' : 's'}` : undefined}
            >
              {day}
              {count > 0 && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  ))}
                  {count > 4 && <span className="text-[8px] leading-none text-emerald-600 dark:text-emerald-300">+</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Has logs
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded ring-2 ring-slate-900 dark:ring-slate-100" /> Today
        </span>
      </div>
    </div>
  );
}
