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

export default function FinishedGoodsStockPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/products');
      console.log('res', res);
      const arr = Array.isArray(res.data) ? res.data : [];

      // Normalize once to avoid heavy work during rendering/filtering
      const normalized = arr.map((p) => {
        const temperatureText = p?.temperature
          ? [p.temperature?.value, p.temperature?.unit].filter(Boolean).join(' ')
          : '-';
        const densityText = p?.density
          ? [p.density?.value, p.density?.unit].filter(Boolean).join(' ')
          : '-';
        const dimensionText = p?.dimension
          ? [p.dimension?.length, p.dimension?.width, p.dimension?.thickness].every(v => v != null)
            ? `${p.dimension.length} x ${p.dimension.width} x ${p.dimension.thickness} ${p.dimension?.unit ?? ''}`.trim()
            : '-'
          : '-';
        const packingName = p?.packingType?.productName ?? '-';
        const productTypeName = p?.productType?.name ?? '-';
        const price = toNum(p?.salePrice ?? p?.price, 0);
        const currentStock = toNum(p?.currentStock, 0);
        const minimumStock = toNum(p?.minimumStock, 0);
        const purchasePrice = toNum(p?.purchasePrice, 0);

        // Precompute a searchable index (lowercased string)
        const searchIndex = [
          p?.productName ?? '',
          p?.sku ?? '',
          temperatureText,
          densityText,
          dimensionText,
          packingName,
          productTypeName
        ].join(' ').toLowerCase();

        return {
          ...p,
          temperatureText,
          densityText,
          dimensionText,
          packingName,
          productTypeName,
          price,
          currentStock,
          minimumStock,
          purchasePrice,
          searchIndex,
        };
      });

      setProducts(normalized);
      setError(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load products';
      setError(msg);
      setProducts([]);
      toast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.searchIndex.includes(term));
  }, [products, dq]);

  const Row = memo(function Row({ item }) {
    return (
      <tr key={item._id} className="hover:bg-most border-b border-color-200">
        <td className="px-3 py-2 capitalize">{item.productName || item.name}</td>
        <td className="px-3 py-2">{item.temperatureText}</td>
        <td className="px-3 py-2">{item.densityText}</td>
        <td className="px-3 py-2">{item.dimensionText}</td>
        <td className="px-3 py-2">{item.packingName}</td>
        <td className="px-3 py-2">{item.productTypeName}</td>
        <td className="px-3 py-2 text-right">{item.currentStock ?? 0}</td>
        <td className="px-3 py-2 text-right">{item.price}</td>
      </tr>
    );
  });

  return (
    <Inventory>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold capitalize">finished goods stock</h1>
        <div className="flex gap-2">
          <CustomInput
                type="text"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm border-color-100" 
                parent_className="mb-0"
              />
          <button
            onClick={fetchProducts}
            className="px-2 py-1 rounded-lg border border-color-200 cursor-pointer text-sm"
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
        <div className="text-gray-500">No products found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-sm border-gray-500">
          <table className="min-w-full  bg-most-secondary text-sm ">
            <thead className="bg-secondary">
              <tr className='border-b border-color-100'>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Temperature</th>
                <th className="px-3 py-2 text-left">Density</th>
                <th className="px-3 py-2 text-left">Dimension</th>
                <th className="px-3 py-2 text-left">Packing Type</th>
                <th className="px-3 py-2 text-left">Product Type</th>
                <th className="px-3 py-2 text-right">Current Stock</th>
                <th className="px-3 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <Row key={p._id} item={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Inventory>
  );
}