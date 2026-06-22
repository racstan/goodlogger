'use client';

import { useState, useEffect, useRef } from 'react';
import { importData, getBackupMetadata, exportSelected } from '@/app/actions/backup';
import JSZip from 'jszip';

type ProjectItem = { id: string; name: string };
type TemplateItem = { id: string; name: string };

export default function SettingsPage() {
  const [metadata, setMetadata] = useState<{ projects: ProjectItem[]; templates: TemplateItem[] } | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const [importResult, setImportResult] = useState<{ success?: boolean; error?: string; summary?: Record<string, number> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBackupMetadata()
      .then((data) => {
        setMetadata(data);
        setSelectedProjectIds(data.projects.map((p) => p.id));
        setSelectedTemplateIds(data.templates.map((t) => t.id));
      })
      .catch(console.error);
  }, []);

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllProjects = () => {
    if (!metadata) return;
    if (selectedProjectIds.length === metadata.projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(metadata.projects.map((p) => p.id));
    }
  };

  const handleToggleAllTemplates = () => {
    if (!metadata) return;
    if (selectedTemplateIds.length === metadata.templates.length) {
      setSelectedTemplateIds([]);
    } else {
      setSelectedTemplateIds(metadata.templates.map((t) => t.id));
    }
  };

  const handleExport = async () => {
    if (selectedProjectIds.length === 0 && selectedTemplateIds.length === 0) {
      alert('Please select at least one project or template to export.');
      return;
    }

    setExporting(true);
    try {
      const data = await exportSelected(selectedProjectIds, selectedTemplateIds);
      const zip = new JSZip();

      // Add each template as a separate JSON file
      for (const t of data.templates) {
        zip.file(
          `templates/template_${t.id}.json`,
          JSON.stringify({ type: 'template', ...t }, null, 2)
        );
      }

      // Add each project as a separate JSON file
      for (const p of data.projects) {
        zip.file(
          `projects/project_${p.id}.json`,
          JSON.stringify({ type: 'project', ...p }, null, 2)
        );
      }

      // Group and add logs by project and template
      const logsByProject: Record<string, typeof data.logs> = {};
      const logsByTemplateOnly: Record<string, typeof data.logs> = {};
      for (const l of data.logs) {
        if (l.projectId) {
          if (!logsByProject[l.projectId]) logsByProject[l.projectId] = [];
          logsByProject[l.projectId].push(l);
        } else if (l.templateId) {
          if (!logsByTemplateOnly[l.templateId]) logsByTemplateOnly[l.templateId] = [];
          logsByTemplateOnly[l.templateId].push(l);
        }
      }

      for (const [projectId, list] of Object.entries(logsByProject)) {
        zip.file(
          `logs/project_${projectId}_logs.json`,
          JSON.stringify({ type: 'logs', projectId, logs: list }, null, 2)
        );
      }

      for (const [templateId, list] of Object.entries(logsByTemplateOnly)) {
        zip.file(
          `logs/template_${templateId}_logs.json`,
          JSON.stringify({ type: 'logs', templateId, logs: list }, null, 2)
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goodlogger-backup-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);
    setImportResult(null);

    const templates: any[] = [];
    const projects: any[] = [];
    const logs: any[] = [];

    const parseJsonString = (text: string) => {
      try {
        const obj = JSON.parse(text);
        if (!obj) return;

        // Support old single backup file format
        if (obj.version === 1 || ('templates' in obj && 'projects' in obj)) {
          if (Array.isArray(obj.templates)) templates.push(...obj.templates);
          if (Array.isArray(obj.projects)) projects.push(...obj.projects);
          if (Array.isArray(obj.logs)) logs.push(...obj.logs);
          return;
        }

        // Support new individual file formats
        if (obj.type === 'template') {
          templates.push(obj);
        } else if (obj.type === 'project') {
          projects.push(obj);
        } else if (obj.type === 'logs') {
          if (Array.isArray(obj.logs)) {
            logs.push(
              ...obj.logs.map((l: any) => ({
                ...l,
                projectId: l.projectId !== undefined ? l.projectId : obj.projectId || null,
                templateId: l.templateId !== undefined ? l.templateId : obj.templateId || null,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to parse JSON file:', err);
      }
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const jsonFiles = Object.keys(zip.files).filter((name) => name.endsWith('.json'));
          for (const jsonPath of jsonFiles) {
            const text = await zip.files[jsonPath].async('string');
            parseJsonString(text);
          }
        } else if (file.name.endsWith('.json')) {
          const text = await file.text();
          parseJsonString(text);
        }
      }

      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        templates,
        projects,
        logs,
      };

      const result = await importData(payload);
      setImportResult(result);

      // Refresh metadata list in settings
      const updatedMeta = await getBackupMetadata();
      setMetadata(updatedMeta);
      setSelectedProjectIds(updatedMeta.projects.map((p) => p.id));
      setSelectedTemplateIds(updatedMeta.templates.map((t) => t.id));
    } catch (err) {
      console.error('Import failed:', err);
      setImportResult({ error: 'Import failed. Check that your backup ZIP or JSON files are valid.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your data and backups</p>
      </div>

      {/* Export Section */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
        <h2 className="font-medium text-lg">Export Backup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select projects and templates to download as a structured ZIP file containing individual JSON files.
        </p>

        {metadata ? (
          <div className="space-y-4">
            {/* Projects list */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Projects ({selectedProjectIds.length}/{metadata.projects.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllProjects}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline min-h-9 px-2"
                >
                  {selectedProjectIds.length === metadata.projects.length ? 'Unselect All' : 'Select All'}
                </button>
              </div>
              {metadata.projects.length > 0 ? (
                <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                  {metadata.projects.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(p.id)}
                        onChange={() => handleToggleProject(p.id)}
                        className="min-h-4 min-w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-1">No projects available.</p>
              )}
            </div>

            {/* Templates list */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Templates ({selectedTemplateIds.length}/{metadata.templates.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllTemplates}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline min-h-9 px-2"
                >
                  {selectedTemplateIds.length === metadata.templates.length ? 'Unselect All' : 'Select All'}
                </button>
              </div>
              {metadata.templates.length > 0 ? (
                <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                  {metadata.templates.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTemplateIds.includes(t.id)}
                        onChange={() => handleToggleTemplate(t.id)}
                        className="min-h-4 min-w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{t.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-1">No templates available.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 flex justify-center">
            <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !metadata}
          className="rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm min-h-11 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50"
        >
          {exporting ? 'Creating ZIP…' : 'Export Selected Data'}
        </button>
      </section>

      {/* Import Section */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <h2 className="font-medium text-lg">Import Backup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Restore templates, projects, and logs from ZIP archives or individual JSON backup files. You can select multiple files at once.
        </p>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.zip"
            multiple
            onChange={handleImport}
            className="hidden"
            id="import-files"
          />
          <label
            htmlFor="import-files"
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
                Select Files / ZIPs
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
                <p className="font-medium">Import completed successfully!</p>
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

      {/* Account Section */}
      <section className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3">
        <h2 className="font-medium">Account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign out from the header menu, or delete your account by contacting support.
        </p>
      </section>
    </div>
  );
}
