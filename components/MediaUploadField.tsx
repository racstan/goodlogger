'use client';

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { FieldDef } from '@/lib/schema';
import { AudioRecorder } from './AudioRecorder';
import { CameraRecorder } from './CameraRecorder';

type Props = {
  f: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
};

export function MediaUploadField({ f, value, onChange }: Props) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const valStr = typeof value === 'string' ? value : '';

  const handleDirectUpload = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return alert('Cloudinary is not configured.');
    
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'goodlogger_unsigned');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.secure_url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDirectUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      {valStr ? (
        <div className={`rounded border border-slate-200 dark:border-slate-700 p-2 relative ${f.type === 'audio' ? 'block w-full' : 'inline-block'}`}>
          {f.type === 'image' && (
            <img src={valStr} alt="Uploaded Media" className="max-h-48 object-contain rounded" />
          )}
          {f.type === 'video' && (
            <video src={valStr} controls className="max-h-48 rounded" />
          )}
          {f.type === 'audio' && (
            <audio src={valStr} controls className="w-full" />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className={valStr ? 'hidden' : 'block'}>
        {showRecorder ? (
          f.type === 'audio' ? (
            <AudioRecorder
              onUploadSuccess={(url) => {
                onChange(url);
                setShowRecorder(false);
              }}
              onCancel={() => setShowRecorder(false)}
            />
          ) : (
            <CameraRecorder
              mode={f.type === 'image' ? 'image' : 'video'}
              onUploadSuccess={(url) => {
                onChange(url);
                setShowRecorder(false);
              }}
              onCancel={() => setShowRecorder(false)}
            />
          )
        ) : (
          <div className="flex flex-col gap-2">
            <CldUploadWidget
              uploadPreset="goodlogger_unsigned"
              onSuccess={(result) => {
                // Force reset body overflow in case the widget modal locks it
                document.body.style.overflow = '';
                if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
                  onChange(result.info.secure_url);
                }
              }}
              options={{
                clientAllowedFormats:
                  f.type === 'image'
                    ? ['png', 'jpeg', 'webp', 'gif']
                    : f.type === 'video'
                    ? ['mp4', 'webm', 'ogg']
                    : f.type === 'audio'
                    ? ['mp3', 'wav', 'ogg']
                    : undefined,
                maxFiles: 1,
                sources: ['local', 'camera', 'url'],
              }}
            >
              {({ open }) => {
                return (
                  <button
                    type="button"
                    onClick={() => open()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    disabled={isUploading}
                    className={`w-full flex flex-col items-center justify-center min-h-[100px] border-2 border-dashed rounded transition-colors text-sm ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="mb-2">
                      {isUploading ? 'Uploading...' : `Click or Drag & Drop to upload ${f.type}`}
                    </span>
                    {!isUploading && <span className="text-xs opacity-75">Max 1 file</span>}
                  </button>
                );
              }}
            </CldUploadWidget>

            {f.type === 'audio' && (
              <button
                type="button"
                onClick={() => setShowRecorder(true)}
                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
                Or Record Microphone
              </button>
            )}

            {f.type === 'video' && (
              <button
                type="button"
                onClick={() => setShowRecorder(true)}
                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                Or Record Camera
              </button>
            )}

            {f.type === 'image' && (
              <button
                type="button"
                onClick={() => setShowRecorder(true)}
                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                Or Take Photo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
