'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState, memo } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import Inventory from '../page';
import { useToast } from '@/components/toast';
import CustomInput from '@/components/inputs/CustomInput';

// Coerce Mongo Decimal128 ({ $numberDecimal: "123.45" }) or other number-like values to JS number
const toNum = (v, fallback = 0) => {
  if (v == null) return fallback;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  if (typeof v === 'object' && v.$numberDecimal) {
    const n = Number(v.$numberDecimal);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
};

export default function RawMaterialStockPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/raw/all'); // endpoint confirmed
      const arr = Array.isArray(res.data) ? res.data : [];

      const normalized = arr.map((m) => {
        const name = m.productName || m.name || '';
        const unit = m.product_unit || m.unit || '';
        const sku = m.sku || '';
        const currentStock = toNum(m.currentStock, 0);
        const minimumStock = toNum(m.minimumStock, 0);
        const purchasePrice = toNum(m.purchasePrice, 0);

        const searchIndex = [name, unit, sku].join(' ').toLowerCase();

        return {
          ...m,
          name,
          unit,
          sku,
          currentStock,
          minimumStock,
          purchasePrice,
          searchIndex,
        };
      });

      setMaterials(normalized);
      setError(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load raw materials';
      setError(msg);
      setMaterials([]);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((m) => m.searchIndex.includes(term));
  }, [materials, dq]);

  const Row = memo(function Row({ item }) {
    return (
      <tr key={item._id} className="hover:bg-most border-b border-color-200">
        <td className="px-3 py-2 capitalize">{item.name}</td>
        <td className="px-3 py-2 text-right">{item.currentStock}</td>
        <td className="px-3 py-2">{item.unit || '-'}</td>
        <td className="px-3 py-2 text-right">{item.minimumStock}</td>
        <td className="px-3 py-2 text-right">{item.purchasePrice}</td>
      </tr>
    );
  });

  return (
    <Inventory>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold capitalize">raw material stock</h1>
        <div className="flex gap-2">
          {/* <input
            className="borderrounded-lgpx-2 py-1 text-sm"
            placeholder="Search name / sku / unit"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          /> */}
          <CustomInput
                type="text"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="rounded-lg px-2 py-1 text-sm"
                parent_className="mb-0"
              />
          <button
            onClick={fetchMaterials}
            className="px-2 py-1 rounded-lg border border-color-200 hover:bg-gray-100 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No raw materials found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-sm border-gray-500">
          <table className="min-w-full  bg-most-secondary text-sm ">
            <thead className="bg-secondary">
              <tr className='border-b border-color-200'>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-right">Current Stock</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Min. Stock</th>
                <th className="px-3 py-2 text-right">Purchase Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <Row key={m._id} item={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Inventory>
  );
}