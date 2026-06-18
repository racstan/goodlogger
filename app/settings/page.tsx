'use client';

import { useState, useRef } from 'react';
import { exportAll, importData, type ExportData } from '@/app/actions/backup';

export default function SettingsPage() {
  const [importResult, setImportResult] = useState<{ success?: boolean; error?: string; summary?: Record<string, number> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goodlogger-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      const result = await importData(data);
      setImportResult(result);
    } catch {
      setImportResult({ error: 'Invalid backup file. Please select a valid JSON file.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your data and preferences</p>
      </div>

      {/* Export */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <h2 className="font-medium">Export Backup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Download all your templates, projects, and logs as a JSON file. Use this to back up your data or transfer it to another instance.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm min-h-11 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Download Backup'}
        </button>
      </section>

      {/* Import */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <h2 className="font-medium">Import Backup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Restore from a backup file. Existing data with the same name will be updated, and duplicates will be skipped.
        </p>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className={`inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm min-h-11 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${importing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {importing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Choose Backup File
              </>
            )}
          </label>
        </div>

        {importResult && (
          <div className={`rounded p-3 text-sm ${importResult.error ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
            {importResult.error ? (
              <p>{importResult.error}</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">Import successful!</p>
                <ul className="list-disc list-inside text-xs">
                  {importResult.summary?.templates !== undefined && <li>{importResult.summary.templates} template(s)</li>}
                  {importResult.summary?.projects !== undefined && <li>{importResult.summary.projects} project(s)</li>}
                  {importResult.summary?.logsImported !== undefined && <li>{importResult.summary.logsImported} log(s) imported</li>}
                  {importResult.summary?.logsSkipped !== undefined && <li>{importResult.summary.logsSkipped} log(s) skipped (duplicates)</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Account info */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <h2 className="font-medium">Account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign out from the header menu, or delete your account by contacting support.
        </p>
      </section>
    </div>
  );
}
