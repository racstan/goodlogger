'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DeleteButton } from '@/components/DeleteButton';
import { ProjectLogForm } from '@/components/ProjectLogForm';
import type { FieldDef, LogValue, LogValues } from '@/lib/schema';

type LogEntry = {
  id: string;
  values: Record<string, LogValue>;
  loggedAt: string;
  serial: number;
};

type TemplateGroup = {
  id: string;
  name: string;
  fields: FieldDef[];
};

type Props = {
  projectId: string;
  templates: TemplateGroup[];
  parsedLogs: LogEntry[];
  nextSerial: number;
  allFields: FieldDef[];
  fullScreenMode?: boolean;
};

function formatCell(v: LogValue | undefined, f?: FieldDef, onImageClick?: () => void): React.ReactNode {
  if (v === undefined || v === null || v === '') return '—';
  if (f) {
    if (f.type === 'image' && typeof v === 'string') {
      return (
        <button 
          type="button"
          onClick={onImageClick ? onImageClick : () => window.open(v, '_blank')}
          className="block w-16 h-16 cursor-zoom-in"
        >
          <img src={v} alt="Uploaded" className="object-cover w-full h-full rounded border border-slate-200 dark:border-slate-700 transition-opacity hover:opacity-80" />
        </button>
      );
    }
    if (f.type === 'audio' && typeof v === 'string') {
      return <audio src={v} controls className="w-48 h-8" />;
    }
    if (f.type === 'video' && typeof v === 'string') {
      return <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">View Video</a>;
    }
  }
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object' && v !== null && 'value' in v && !Array.isArray(v)) {
    return String(v.value);
  }
  return String(v);
}

function getPlainCellText(v: LogValue | undefined, f?: FieldDef): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (f) {
    if (f.type === 'image' || f.type === 'audio' || f.type === 'video') {
      return undefined;
    }
  }
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object' && v !== null && 'value' in v && !Array.isArray(v)) {
    return String(v.value);
  }
  return String(v);
}

export function ProjectLogsManager({ projectId, templates, parsedLogs, nextSerial, allFields, fullScreenMode }: Props) {
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const startEdit = (log: LogEntry) => {
    // Scroll the form into view
    const formElement = document.getElementById('log-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    setEditingLog(log);
  };

  const images = useMemo(() => {
    const imgs: { url: string, logId: string, fieldId: string, serial: number, fieldName: string }[] = [];
    parsedLogs.forEach(log => {
      allFields.forEach(f => {
        const v = log.values[f.id];
        if (f.type === 'image' && typeof v === 'string') {
          imgs.push({ url: v, logId: log.id, fieldId: f.id, serial: log.serial, fieldName: f.name });
        }
      });
    });
    return imgs;
  }, [parsedLogs, allFields]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  const handleImageClick = (logId: string, fieldId: string) => {
    const idx = images.findIndex(img => img.logId === logId && img.fieldId === fieldId);
    if (idx !== -1) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

  const cancelEdit = () => {
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      {/* Unified scrollable log table */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm dark:text-slate-100">
              Entries
              {parsedLogs.length > 0 && (
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">({parsedLogs.length})</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 p-0.5">
              <button 
                onClick={scrollLeft} 
                className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                title="Scroll Left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
              <button 
                onClick={scrollRight} 
                className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                title="Scroll Right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            {parsedLogs.length > 0 && (
              <div className="md:hidden text-xs text-slate-400 dark:text-slate-500">
                {parsedLogs.length} log{parsedLogs.length === 1 ? '' : 's'}
              </div>
            )}
            {!fullScreenMode && (
              <Link
                href={`/projects/${projectId}/logs`}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                title="View All Entries in Fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                Expand All
              </Link>
            )}
          </div>
        </div>
        {parsedLogs.length > 0 ? (
          <>
            {/* ─── Mobile card view (< md) ─── */}
            <div className={`md:hidden p-3 space-y-3 ${fullScreenMode ? '' : 'max-h-[400px] overflow-y-auto'}`}>
              {[...parsedLogs].reverse().map((log) => (
                <div key={log.id} className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      #{log.serial} · {new Date(log.loggedAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${projectId}/logs/${log.id}`}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-9 flex items-center justify-center"
                      >
                        Expand
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEdit(log)}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-9"
                      >
                        Edit
                      </button>
                      <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${projectId}` }} />
                    </div>
                  </div>
                  {allFields.map((f) => {
                    const v = log.values[f.id];
                    return (
                      <div key={f.id} className="flex items-baseline gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0 w-28 truncate">{f.name}:</span>
                        <span className="font-medium break-words min-w-0">{formatCell(v, f, () => handleImageClick(log.id, f.id))}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* ─── Desktop table view (md+) ─── */}
            <div 
              ref={tableContainerRef}
              className={`hidden md:block overflow-auto ${fullScreenMode ? 'h-[calc(100vh-8rem)]' : ''}`} 
              style={fullScreenMode ? undefined : { height: '400px' }}
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-2 font-medium whitespace-nowrap">#</th>
                    {allFields.map((f) => (
                      <th key={f.id} className="px-4 py-2 font-medium whitespace-nowrap">{f.name}</th>
                    ))}
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Logged At</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap text-right pr-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 dark:text-slate-500 w-4">{log.serial}</span>
                          <Link
                            href={`/projects/${projectId}/logs/${log.id}`}
                            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            title="Expand to Fullscreen"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                          </Link>
                        </div>
                      </td>
                      {allFields.map((f) => {
                        const v = log.values[f.id];
                        return (
                          <td key={f.id} className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate" title={getPlainCellText(v, f)}>
                            {formatCell(v, f, () => handleImageClick(log.id, f.id))}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        {new Date(log.loggedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 flex items-center justify-end gap-2 pr-4">
                        <button
                          type="button"
                          onClick={() => startEdit(log)}
                          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-11 sm:min-h-0"
                        >
                          Edit
                        </button>
                        <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${projectId}` }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No entries yet. Use the form below to log your first entry.
          </div>
        )}
      </div>

      {/* Combined log form — shows all fields from all templates */}
      {!fullScreenMode && (
        <div id="log-form-container">
          <ProjectLogForm
            key={editingLog?.id ?? 'new'}
            projectId={projectId}
            templates={templates}
            nextSerial={nextSerial}
            editingLog={editingLog ? { id: editingLog.id, serial: editingLog.serial, values: editingLog.values } : null}
            onCancelEdit={cancelEdit}
            parsedLogs={parsedLogs}
          />
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <button 
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightboxOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            #{images[lightboxIndex].serial} · {images[lightboxIndex].fieldName}
            <br />
            {lightboxIndex + 1} / {images.length}
          </div>

          <button 
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 disabled:opacity-30"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(i => (i - 1 + images.length) % images.length);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img 
            src={images[lightboxIndex].url} 
            alt="Enlarged log image" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded select-none"
            onClick={(e) => e.stopPropagation()}
          />

          <button 
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 disabled:opacity-30"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(i => (i + 1) % images.length);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
