'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { axiosInstance } from '@/lib/axiosInstance';

const emptyInput = () => ({ sourceKey: '', quantity: '' });
const requestKey = () =>
  `chopping:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;

export default function ChoppingBatchPage() {
  const { list: warehouses } = useWarehouses();
  const [sources, setSources] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [inputs, setInputs] = useState([emptyInput()]);
  const [form, setForm] = useState({
    batchNo: '',
    outputItemId: '',
    outputWarehouseId: '',
    outputQuantity: '',
    outputLotNo: '',
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const [stockResponse, setupResponse, outputResponse] = await Promise.all([
        axiosInstance.get('/api/inventory/stock', {
          params: { positiveOnly: 'true', limit: 200 },
        }),
        axiosInstance.get('/api/item-master/setup'),
        axiosInstance.get('/api/item-master/items/options', {
          params: { familyCode: 'CHOPPED_FIBRE' },
        }),
      ]);
      const familyById = new Map(
        (setupResponse.data?.families || []).map(family => [String(family._id), family.code]),
      );
      const stockSources = (stockResponse.data || [])
        .filter(row => {
          const family = familyById.get(String(row.itemId?.familyId));
          const regularInput = ['ET', 'CHOPPED_FIBRE'].includes(family)
            && row.qualityStatus === 'AVAILABLE'
            && ['AVAILABLE', 'PACKED'].includes(row.processStatus);
          const rejectedBlanket = family === 'BLANKET'
            && row.qualityStatus === 'REJECTED'
            && row.processStatus === 'REJECTED';
          return regularInput || rejectedBlanket;
        })
        .map(row => ({
          key: `lot:${row._id}`,
          label:
            `${row.itemId?.sku || ''} · ${row.itemId?.name || ''} · `
            + `${row.available} ${row.baseUom} · ${row.lotId?.lotNo || ''}`,
          itemId: row.itemId?._id,
          warehouseId: row.warehouseId?._id,
          bin: row.bin,
          lotNo: row.lotId?.lotNo,
          qualityStatus: row.qualityStatus,
          processStatus: row.processStatus,
          maxQuantity: row.available,
        }));
      setSources(stockSources);
      setOutputs(outputResponse.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load chopping stock');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateInput = (index, patch) =>
    setInputs(current => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    ));
  const sourceByKey = useMemo(
    () => new Map(sources.map(source => [source.key, source])),
    [sources],
  );
  const submit = async event => {
    event.preventDefault();
    const materialInputs = inputs.map(row => {
      const source = sourceByKey.get(row.sourceKey);
      return {
        itemId: source?.itemId,
        warehouseId: source?.warehouseId,
        bin: source?.bin,
        lotNo: source?.lotNo,
        qualityStatus: source?.qualityStatus,
        processStatus: source?.processStatus,
        quantity: Number(row.quantity),
      };
    });
    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/manufacturing/chopping-batches', {
        ...form,
        outputQuantity: Number(form.outputQuantity),
        inputs: materialInputs,
      }, {
        headers: { 'Idempotency-Key': requestKey() },
      });
      Toast.success(response?.api?.message || 'Chopping batch posted');
      setResult(response.data?.transaction?.processMetrics || null);
      setInputs([emptyInput()]);
      setForm({
        batchNo: '',
        outputItemId: '',
        outputWarehouseId: '',
        outputQuantity: '',
        outputLotNo: '',
      });
      await load();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to post chopping batch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Chopping Batch</h1>
        <p className="mt-1 text-sm text-secondary-text">
          ET and rejected Blanket may mix only when classification temperature matches.
          Double Chopped Fibre requires a separate second conversion.
        </p>
      </div>
      <section className="space-y-3 rounded-xl border border-white-100 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Stored inputs</h2>
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => setInputs(current => [...current, emptyInput()])}
          >
            Add input
          </button>
        </div>
        {inputs.map((row, index) => {
          const selected = sourceByKey.get(row.sourceKey);
          return (
            <div key={index} className="grid grid-cols-1 gap-x-4 rounded-lg border border-white-100 p-3 md:grid-cols-2">
              <AdaptiveSelectInput
                label={`Input ${index + 1}`}
                name={`chopInput-${index}`}
                placeholder="Select ET, rejected roll or Chopped Fibre"
                value={row.sourceKey}
                onChange={event => {
                  const source = sourceByKey.get(event.target.value);
                  updateInput(index, {
                    sourceKey: event.target.value,
                    quantity: '',
                  });
                }}
                options={sources.map(source => ({ value: source.key, label: source.label }))}
                required
              />
              <CustomInput
                label={`Quantity${selected ? ` (max ${selected.maxQuantity})` : ''}`}
                name={`chopQty-${index}`}
                type="number"
                min="0.000001"
                max={selected?.maxQuantity}
                step="any"
                value={row.quantity}
                onChange={event => updateInput(index, { quantity: event.target.value })}
                required
              />
            </div>
          );
        })}
      </section>
      <section className="grid grid-cols-1 gap-x-4 rounded-xl border border-white-100 p-5 md:grid-cols-3">
        <CustomInput
          label="Chopping Batch Number"
          name="choppingBatchNo"
          value={form.batchNo}
          onChange={event => setForm(current => ({ ...current, batchNo: event.target.value }))}
          required
        />
        <AdaptiveSelectInput
          label="Output Chopped Fibre"
          name="choppedOutput"
          placeholder="Select output grade"
          value={form.outputItemId}
          onChange={event => setForm(current => ({ ...current, outputItemId: event.target.value }))}
          options={outputs}
          required
        />
        <AdaptiveSelectInput
          label="Output Warehouse"
          name="choppedWarehouse"
          placeholder="Select warehouse"
          value={form.outputWarehouseId}
          onChange={event => setForm(current => ({
            ...current,
            outputWarehouseId: event.target.value,
          }))}
          options={warehouses.map(warehouse => ({
            value: warehouse._id,
            label: `${warehouse.code || ''} · ${warehouse.name}`,
          }))}
          required
        />
        <CustomInput
          label="Measured Output Weight (kg)"
          name="choppedOutputQty"
          type="number"
          min="0.000001"
          step="any"
          value={form.outputQuantity}
          onChange={event => setForm(current => ({
            ...current,
            outputQuantity: event.target.value,
          }))}
          required
        />
        <CustomInput
          label="Output Lot Number"
          name="choppedOutputLot"
          value={form.outputLotNo}
          onChange={event => setForm(current => ({
            ...current,
            outputLotNo: event.target.value,
          }))}
        />
      </section>
      <SubmitButton loading={saving} label="Post Chopping Conversion" />
      {result && (
        <section className="grid grid-cols-2 gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 md:grid-cols-4">
          {[
            ['Input weight', `${result.inputWeightKg} kg`],
            ['Output weight', `${result.outputWeightKg} kg`],
            ['Process loss', `${result.processLossKg} kg`],
            ['Yield', `${result.yieldPercent}%`],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-secondary-text">{label}</div>
              <div className="mt-1 font-semibold">{value}</div>
            </div>
          ))}
        </section>
      )}
    </form>
  );
}
