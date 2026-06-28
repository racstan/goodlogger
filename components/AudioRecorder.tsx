'use client';

import { useState, useRef } from 'react';

type Props = {
  onUploadSuccess: (url: string) => void;
  onCancel?: () => void;
};

export function AudioRecorder({ onUploadSuccess, onCancel }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio-recording.webm');
      formData.append('upload_preset', 'goodlogger_unsigned');

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error('Missing Cloudinary Cloud Name');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      onUploadSuccess(data.secure_url);
    } catch (err) {
      console.error('Failed to upload audio', err);
      alert('Failed to upload recording.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100px] border-2 border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800/50">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Uploading recording...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100px] border-2 border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800/50 p-4">
      {isRecording ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-slate-700 dark:text-slate-300">{formatTime(recordingTime)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
          >
            Stop & Save
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
            Record Audio
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline mt-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
