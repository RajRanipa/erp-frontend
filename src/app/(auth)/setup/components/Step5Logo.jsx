'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import {axiosInstance} from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';

/**
 * Step5Logo — upload a company logo with drag & drop, click-to-browse, preview, and progress.
 *
 * Props:
 * - values: full company object (expects values.logoUrl)
 * - saving: boolean (disable buttons while saving)
 * - onSave: (partialPayload) => Promise
 * - onNext: () => void
 * - onBack: () => void (optional)
 */
export default function Step5Logo({ values = {}, saving, onSave, onNext, onBack, onValidityChange, onDirtyChange }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(values?.logoUrl || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef(null);


  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch (_) {}
      }
    };
  }, [preview]);
  // Keep preview in sync if it comes from server later and no local changes
  useEffect(() => {
    if (!dirty && !file && values?.logoUrl && values.logoUrl !== preview) {
      setPreview(values.logoUrl);
      setError('');
      setFile(null);
      onValidityChange?.(true);
      onDirtyChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.logoUrl]);

  // Validate current state and Toast parent about validity and dirtiness
  useEffect(() => {
    const hasValidLogo = ((!!file) && validateFile(file) === '') ||
                         ((!!preview) && preview.startsWith('http'));
    onValidityChange?.(hasValidLogo);
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, preview, dirty]);

  const MAX_MB = 2; // adjust if needed
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

  const validateFile = (f) => {
    if (!f) return '';
    if (!ACCEPT.includes(f.type)) return 'Unsupported format. Use PNG, JPG, WEBP, or SVG.';
    const mb = f.size / (1024 * 1024);
    if (mb > MAX_MB) return `File too large. Max ${MAX_MB}MB`;
    return '';
  };

  const validatePreview = (url) => {
    if (!url) return 'No logo selected';
    if (url.startsWith('http')) return '';
    return 'Invalid logo URL';
  };

  const onSelectFile = async (f) => {
    const msg = validateFile(f);
    if (msg) {
      setError(msg);
      setFile(null);
      setPreview('');
      setDirty(true);
      onValidityChange?.(false);
      onDirtyChange?.(true);
      Toast.error(msg);
      return;
    }

    setError('');
    setFile(f);

    // show temporary local preview
    const objectUrl = URL.createObjectURL(f);
    setPreview(objectUrl);
    setDirty(true);
    onDirtyChange?.(true);

    try {
      setUploading(true);
      setProgress(0);
      const form = new FormData();
      form.append('file', f);

      const { data } = await axiosInstance.post('/api/uploads/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
        },
        withCredentials: true,
      });

      const url = data?.data?.url; // dev upload controller shape
      if (!url) {
        throw new Error('Upload failed: missing URL in response');
      }

      // swap preview to server URL and emit partial up; DO NOT patch here
      URL.revokeObjectURL(objectUrl);
      setPreview(url);
      setFile(null);
      setDirty(true); // still dirty until user hits global Save
      onValidityChange?.(true);
      onDirtyChange?.(true);
      // Let the shell save this on global Save/Next
      onSave?.({ logoUrl: url, setupProgress: { logo: true } });
      Toast.success('Logo uploaded. Click Save to persist.');
    } catch (err) {
      console.error(err);
      const emsg = err?.response?.data?.message || err.message || 'Upload failed';
      setError(emsg);
      Toast.error(emsg);
      onValidityChange?.(false);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dt = e.dataTransfer;
      if (!dt?.files?.length) return;
      onSelectFile(dt.files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onBrowseClick = () => inputRef.current?.click();

  // (no-op, handled by auto-upload in onSelectFile)

  const removeLogo = () => {
    setFile(null);
    setPreview('');
    setError('');
    setDirty(true);
    onValidityChange?.(false);
    onDirtyChange?.(true);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        className={`group border-2 border-dashed border-white-600 rounded-md p-6 text-center cursor-pointer transition ${uploading ? 'opacity-60' : 'hover:bg-white-700 hover:border-black-600'
          }`}
        onClick={onBrowseClick}
        role="button"
        aria-label="Upload company logo"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBrowseClick()}
      >
        {!preview ? (
          <div>
            <div className="text-sm text-secondary-text group-hover:text-black-700 font-medium">Drag & drop your logo here</div>
            <div className="text-xs text-primary-text group-hover:text-black-600 mt-1">or click to browse (PNG, JPG, WEBP, SVG — up to {MAX_MB}MB)</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo preview" className="h-24 w-auto object-contain rounded" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={removeLogo}
                disabled={uploading || saving}
                className="px-3 py-1 border border-white-400 group-hover:border-black-400 rounded text-sm text-white-700 group-hover:text-black-700 disabled:opacity-50 hover:bg-white-400"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={onBrowseClick}
                disabled={uploading || saving}
                className="px-3 py-1 border border-white-400 group-hover:border-black-400 rounded text-sm text-white-700 group-hover:text-black-700 disabled:opacity-50 hover:bg-white-400"
              >
                Replace
              </button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPT.join(',')}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelectFile(f);
          }}
          disabled={uploading || saving}
        />
      </div>

      {/* File name + validation */}
      {file && (
        <div className="text-xs text-gray-600">
          Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {/* Progress bar */}
      {uploading && (
        <div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="h-2 rounded bg-gray-800" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-gray-600 mt-1">{progress}%</div>
        </div>
      )}

      {/* URL manual entry (optional, fallback) */}
      <div className="pt-2 mt-2">
        <CustomInput
          label="Or paste a logo URL"
          value={preview?.startsWith('http') ? preview : ''}
          onChange={(e) => {
            const v = e.target.value.trim();
            setPreview(v);
            setFile(null);
            const perr = validatePreview(v);
            setError(perr);
            const valid = perr === '';
            setDirty(true);
            onValidityChange?.(valid);
            onDirtyChange?.(true);
            if (valid) {
              onSave?.({ logoUrl: v, setupProgress: { logo: true } });
            }
          }}
          disabled={uploading || saving}
          placeholder="https://.../logo.png"
        />
        <p className="text-xs text-primary-text mt-1">If you already have a hosted logo, paste the URL here and click Save.</p>
      </div>

    </div>
  );
}