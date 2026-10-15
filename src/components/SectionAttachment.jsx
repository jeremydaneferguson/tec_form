"use client";

import { useRef, useState } from 'react';
import { MAX_ATTACHMENT_BYTES } from '@/lib/attachments';

export default function SectionAttachment({ label, value, onChange, onReadingChange, disabled = false }) {
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  const selectFile = async (event) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES || file.name.length > 255) {
      setError('Choose a file up to 5 MB with a filename of up to 255 characters.');
      return;
    }
    setReading(true);
    onReadingChange?.(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the selected file. Please try again.'));
        reader.onabort = () => reject(new Error('File selection was cancelled.'));
        reader.readAsDataURL(file);
      });
      onChange({ name: file.name, size: file.size, data: String(dataUrl).split(',')[1] || '' });
    } catch (readError) {
      setError(readError.message);
    } finally {
      setReading(false);
      onReadingChange?.(false);
    }
  };

  const download = () => {
    try {
      const bytes = Uint8Array.from(atob(value.data), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = value.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Unable to download this attachment. Please upload it again.');
    }
  };

  return (
    <div className="mt-2 space-y-2 text-sm">
      {onChange && (
        <label className="block text-[#546077]">
          Attach a file for {label} (optional, up to 5 MB)
          <input
            ref={inputRef}
            type="file"
            data-skip-autosave="true"
            onChange={selectFile}
            disabled={disabled || reading}
            className="mt-1 block w-full rounded border p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#efeeea] file:px-3 file:py-1 file:text-[#1f2a44]"
          />
        </label>
      )}
      {reading && <p role="status">Reading attachment...</p>}
      {value && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={download} className="break-all text-left font-medium text-[#991b1e] underline" aria-label={`Download ${label} attachment: ${value.name}`}>
            {value.name}
          </button>
          <span className="text-xs text-[#6a7388]">{Math.max(1, Math.ceil(value.size / 1024))} KB</span>
          {onChange && <button type="button" disabled={disabled || reading} onClick={() => { onChange(null); setError(''); if (inputRef.current) inputRef.current.value = ''; }} className="text-sm text-red-700 underline" aria-label={`Remove ${label} attachment`}>Remove</button>}
        </div>
      )}
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  );
}
