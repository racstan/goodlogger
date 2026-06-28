'use client';

import { useState, useRef, useEffect } from 'react';

type Props = {
  mode: 'image' | 'video';
  onUploadSuccess: (url: string) => void;
  onCancel: () => void;
};

export function CameraRecorder({ mode, onUploadSuccess, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Initialize camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: mode === 'video',
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error(err);
        setHasPermission(false);
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode]);

  // Timer for video
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setRecordedBlob(blob);
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(blob);
    };
    recorder.start();
    mediaRecorder.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      alert('Cloudinary not configured');
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', recordedBlob);
      fd.append('upload_preset', 'goodlogger_unsigned');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onUploadSuccess(data.secure_url);
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-sm flex flex-col items-center gap-3">
        <p>Camera permission denied.</p>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-red-200 rounded">Close</button>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 p-4 space-y-4">
      {!recordedBlob ? (
        <>
          <div className="relative bg-black rounded overflow-hidden aspect-video flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 text-white px-2 py-1 rounded text-sm font-mono backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {formatTime(timer)}
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            {mode === 'image' ? (
              <button
                type="button"
                onClick={captureImage}
                className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800" />
              </button>
            ) : (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-14 h-14 rounded-full bg-white border-4 ${isRecording ? 'border-red-300' : 'border-slate-300'} shadow-lg flex items-center justify-center hover:scale-105 transition-transform`}
              >
                <div className={`rounded-full transition-all ${isRecording ? 'w-6 h-6 bg-red-500 rounded-md' : 'w-10 h-10 bg-red-500'}`} />
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="relative bg-black rounded overflow-hidden aspect-video flex items-center justify-center">
            {mode === 'image' ? (
              <img src={URL.createObjectURL(recordedBlob)} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full" />
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-emerald-600 text-white py-2 rounded font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Save & Upload'}
            </button>
            <button
              type="button"
              onClick={() => setRecordedBlob(null)}
              disabled={isUploading}
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 py-2 rounded font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Retake
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={isUploading}
        className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm mt-4 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
