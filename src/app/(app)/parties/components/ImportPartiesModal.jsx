'use client';

import React, { useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Toast } from '@/Components/toast';

import { usePartyImportExport } from '../hooks/usePartyImportExport';
import Dialog from '@/Components/Dialog';

/**
 * ImportPartiesModal
 * - Upload Excel (.xlsx/.xls)
 * - Calls backend import endpoint via hook
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onImported?: (result) => void   // call refetch outside
 */
export default function ImportPartiesModal({ open, onClose, onImported }) {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);

    const { importing, importXlsx } = usePartyImportExport();

    const filename = useMemo(() => file?.name || 'No file selected', [file]);

    if (!open) return null;

    const pickFile = () => fileRef.current?.click?.();

    const handleFile = (f) => {
        if (!f) return;
        const name = String(f.name || '').toLowerCase();
        if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
            Toast.error('Please choose an Excel file (.xlsx or .xls)');
            return;
        }
        setFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const f = e.dataTransfer?.files?.[0];
        handleFile(f);
    };

    const doImport = async () => {
        if (!file) {
            Toast.error('Please select a file first');
            return;
        }
        const res = await importXlsx(file);
        onImported?.(res);
        onClose?.();
        setFile(null);
    };

    return (
        <div className="fixed inset-0 z-[999]">
            {/* modal */}
            <Dialog open={open} onClose={onClose} closeOnOverlay={false} closeOnEsc={false}
                title="Import Parties"
                side="center"
                actions={
                    <>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                                setFile(null);
                                onClose?.();
                            }}
                            disabled={importing}
                        >
                            Cancel
                        </button>
                        <button type="button" className="btn-primary" onClick={doImport} disabled={importing || !file}>
                            {importing ? 'Importing…' : 'Import'}
                        </button>
                    </>
                }
            >
                <div className="p-2 space-y-3">
                    <p className="text-sm text-secondary-text/70 mb-2">
                        Upload an Excel file to bulk create/update parties.
                    </p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />

                    <div
                        className={cn(
                            'rounded-lg border border-dashed border-white-200 p-4 bg-white-100/40',
                            'flex flex-col gap-2 items-center justify-center text-center'
                        )}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={handleDrop}
                    >
                        <div className="text-sm font-medium">Drag & drop your Excel here</div>
                        <div className="text-xs text-secondary-text/70">or</div>
                        <button type="button" className="btn-secondary" onClick={pickFile} disabled={importing}>
                            Choose File
                        </button>
                        <div className="text-xs text-secondary-text/70 mt-2 truncate w-full px-2">{filename}</div>
                    </div>

                    <div className="text-xs text-secondary-text/70 mt-2">
                        Notes:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Use .xlsx format for best results.</li>
                            <li>If a GSTIN already exists, backend will prevent duplicates.</li>
                        </ul>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
