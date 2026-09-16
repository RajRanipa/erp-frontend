'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

export default function SerialLabels({ serials = [], onClose }) {
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all(serials.map(async serial => {
      const url = `${window.location.origin}/trace/${serial.serialNo}`;
      return [serial.serialNo, await QRCode.toDataURL(url, { width: 220, margin: 1 })];
    })).then(entries => {
      if (active) setQrCodes(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, [serials]);

  if (!serials.length) return null;
  return (
    <section className="space-y-4 rounded-xl border border-blue-500/40 bg-blue-500/5 p-5">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #serial-labels, #serial-labels * { visibility: visible !important; }
          #serial-labels { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; }
          .serial-label { break-inside: avoid; border: 1px solid #111 !important; color: #111 !important; background: #fff !important; }
          .serial-label img { width: 34mm; height: 34mm; }
        }
      `}</style>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h2 className="font-semibold">Serial labels are ready</h2>
          <p className="text-sm text-secondary-text">{serials.length} backend-generated serials were posted.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="rounded-lg bg-blue-500 px-4 py-2 text-white" onClick={() => window.print()}>
            Print labels
          </button>
          <button type="button" className="px-3 py-2 text-secondary-text hover:underline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div id="serial-labels" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {serials.map(serial => (
          <article key={serial.serialNo} className="serial-label grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-white-100 bg-background p-4">
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold">{serial.traceSnapshot?.manufacturerName}</p>
              <p className="truncate">{serial.traceSnapshot?.productName}</p>
              <p className="font-mono text-base font-bold tracking-wider">{serial.serialNo}</p>
              <p>SKU: {serial.traceSnapshot?.sku}</p>
              <p>Lot: {serial.traceSnapshot?.lotNo}</p>
              <p>Weight: {serial.catchQuantity ?? '—'} {serial.catchUom || ''}</p>
              <p>Made: {serial.manufacturedAt ? new Date(serial.manufacturedAt).toLocaleString() : 'Not recorded'}</p>
            </div>
            {qrCodes[serial.serialNo] && (
              <Image
                src={qrCodes[serial.serialNo]}
                alt={`Trace QR for ${serial.serialNo}`}
                width={112}
                height={112}
                unoptimized
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
