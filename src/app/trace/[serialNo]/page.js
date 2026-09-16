'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

const specificationValue = specification => {
  const value = String(specification?.value ?? '').trim();
  const unit = String(specification?.unit ?? '').trim();
  if (!unit) return value;
  const comparable = input => input.toLocaleLowerCase().replace(/\s+/g, '');
  return comparable(value).endsWith(comparable(unit)) ? value : `${value} ${unit}`;
};

export default function PublicSerialTracePage({ params }) {
  const [serialNo, setSerialNo] = useState('');
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    let active = true;
    Promise.resolve(params).then(value => {
      if (!active) return;
      const serial = String(value?.serialNo || '');
      setSerialNo(serial);
      const backend = process.env.NEXT_PUBLIC_BACKEND_PORT || '';
      fetch(`${backend}/api/public/trace/${encodeURIComponent(serial)}`)
        .then(async response => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload?.message || 'Serial number was not found');
          return payload.data;
        })
        .then(async data => {
          if (!active) return;
          setTrace(data);
          setQrCode(await QRCode.toDataURL(window.location.href, { width: 220, margin: 1 }));
        })
        .catch(requestError => {
          if (active) setError(requestError.message || 'Unable to verify serial number');
        })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [params]);

  return (
    <main className="max-h-screen bg-[#f3f6f8] px-4 py-10 text-slate-900 overflow-hidden flex justify-center">
      <div className="max-w-3xl rounded-3xl bg-white flex-1 shadow-xl overflow-hidden shadow-slate-200/70 flex flex-col">
        <header className="bg-slate-950 px-6 py-8 text-white md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">Product traceability</p>
          <h1 className="mt-3 text-2xl font-semibold">Serial verification</h1>
          <p className="mt-2 font-mono text-lg tracking-widest text-slate-300">{serialNo}</p>
        </header>
        {loading && <div className="p-10 text-center text-slate-500">Verifying serial…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">×</div>
            <h2 className="mt-4 text-xl font-semibold">Serial not verified</h2>
            <p className="mt-2 text-slate-500">{error}</p>
          </div>
        )}
        {!loading && trace && (
          <div className="p-3 md:p-5 overflow-auto flex-1 max-h-full">
            <div className='gap-3 p-3 md:p-5'>
            <div className='flex flex-col gap-3'>
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    <span>✓</span> Authentic serial
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{trace.product?.name}</h2>
                  <p className="mt-1 text-slate-500">SKU {trace.product?.sku}</p>
                </div>
                {qrCode && (
                  <Image src={qrCode} alt="Trace page QR code" width={112} height={112} unoptimized />
                )}
              </div>
              <span className=" w-full border-t-1 border-slate-200"></span>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                {[
                  ['Manufacturer', trace.manufacturerName],
                  ['Campaign', trace.campaignName || 'Not recorded'],
                  ['Production lot', trace.lotNo],
                  ['Manufactured at', trace.manufacturedAt ? new Date(trace.manufacturedAt).toLocaleString() : 'Not recorded'],
                  ['Weight', trace.weight == null ? 'Not recorded' : `${trace.weight} ${trace.weightUom || ''}`],
                  ['Quality', trace.qualityStatus],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="mt-1 text-base font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Product specification</h3>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                  {(trace.product?.specifications || []).map((specification, index) => (
                    <div key={specification.code} className={`flex justify-between gap-4 px-4 py-3 ${index ? 'border-t border-slate-200' : ''}`}>
                      <span className="text-slate-500">{specification.label}</span>
                      <span className="text-right font-medium">{specificationValue(specification)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400">
                  This page contains public manufacturing trace data only. Commercial and warehouse information is not disclosed.
                </p>
              </section>
            </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
