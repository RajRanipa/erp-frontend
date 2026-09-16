'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { useWarehouses } from '@/hooks/useWarehouses';
import { cn } from '@/utils/cn';
import { mapItemOption } from '@/utils/FGP';
import SerialLabels from '../components/SerialLabels';

const requestKey = prefix =>
  `${prefix}:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
const apiMessage = (error, fallback) => error?.response?.data?.message || fallback;
const localDateTime = () => {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return now.toISOString().slice(0, 16);
};
const isSerialized = item => Boolean(item?.trackingPolicy?.serialTracked);

function parseUnitLines(value, defaultManufacturedAt) {
  const rows = String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return rows.map((line, index) => {
    const [weightValue, manufacturedValue] = line.split(/[\t,;]/).map(part => part.trim());
    const catchQuantity = Number(weightValue);
    if (!Number.isFinite(catchQuantity) || catchQuantity <= 0) {
      throw new Error(`Line ${index + 1} does not contain a positive weight`);
    }
    const manufacturedAt = manufacturedValue || defaultManufacturedAt;
    if (manufacturedAt && Number.isNaN(new Date(manufacturedAt).getTime())) {
      throw new Error(`Line ${index + 1} contains an invalid manufacture time`);
    }
    return { catchQuantity, manufacturedAt: manufacturedAt || undefined };
  });
}

export default function InventoryV2OperationsPage() {
  const { list: warehouses } = useWarehouses();
  const [tab, setTab] = useState('RECEIPT');
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [saving, setSaving] = useState(false);
  const [createdSerials, setCreatedSerials] = useState([]);
  const [receipt, setReceipt] = useState({
    itemId: '', warehouseId: '', quantity: '', catchQuantity: '', unitLines: '',
    lotNo: '', unitCost: '0', note: '', receiptMode: 'PRODUCTION', campaignId: '',
    manufacturedAt: localDateTime(), manualReason: '',
  });
  const [packing, setPacking] = useState({
    itemId: '', warehouseId: '', fromPackingKey: 'UNPACKED', quantity: '',
    packingLabel: '', packagingWarehouseId: '', components: [{ itemId: '', quantity: '1' }],
  });
  const [issue, setIssue] = useState({
    itemId: '', warehouseId: '', packingKey: '', quantity: '',
    purpose: 'ISSUE', referenceId: '', note: '',
  });
  const [transfer, setTransfer] = useState({
    itemId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '', note: '',
  });

  const load = useCallback(async () => {
    try {
      const [itemResponse, stockResponse, contextResponse] = await Promise.all([
        axiosInstance.get('/api/item-master/items', {
          params: { status: 'active', inventory: 'true', limit: 200 },
        }),
        axiosInstance.get('/api/inventory-v2/stock', { params: { limit: 200 } }),
        axiosInstance.get('/api/inventory-v2/receipt-context').catch(() => ({ data: { campaigns: [] } })),
      ]);
      setItems(Array.isArray(itemResponse.data) ? itemResponse.data : []);
      setStock(Array.isArray(stockResponse.data) ? stockResponse.data : []);
      setCampaigns(contextResponse.data?.campaigns || []);
    } catch (error) {
      Toast.error(apiMessage(error, 'Unable to load Item Master V2 operations'));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!warehouses.length) return;
    const warehouseId = String(warehouses[0]._id);
    setReceipt(current => ({ ...current, warehouseId: current.warehouseId || warehouseId }));
    setPacking(current => ({
      ...current,
      warehouseId: current.warehouseId || warehouseId,
      packagingWarehouseId: current.packagingWarehouseId || warehouseId,
    }));
    setIssue(current => ({ ...current, warehouseId: current.warehouseId || warehouseId }));
    setTransfer(current => ({
      ...current,
      fromWarehouseId: current.fromWarehouseId || warehouseId,
    }));
  }, [warehouses]);
  useEffect(() => {
    if (campaigns.length === 1) {
      setReceipt(current => ({ ...current, campaignId: current.campaignId || String(campaigns[0]._id) }));
    }
  }, [campaigns]);

  const itemById = useMemo(() => new Map(items.map(item => [String(item._id), item])), [items]);
  const packagingItems = useMemo(
    () => items.filter(item => item.itemClassId?.code === 'PACKAGING'),
    [items],
  );
  const blanketItems = useMemo(
    () => items.filter(item => item.familyId?.code === 'BLANKET'),
    [items],
  );
  const selectedReceiptItem = itemById.get(receipt.itemId);
  const selectedIssueItem = itemById.get(issue.itemId);
  const selectedTransferItem = itemById.get(transfer.itemId);
  const receiptIsSerialized = isSerialized(selectedReceiptItem);
  const warehouseOptions = warehouses.map(row => ({ value: String(row._id), label: row.name }));
  const itemOptions = items.map(item => ({ value: String(item._id), label: mapItemOption(item) }));
  const campaignOptions = campaigns.map(campaign => ({
    value: String(campaign._id),
    label: `${campaign.name} · Running`,
  }));

  const packingBuckets = (itemId, warehouseId) => {
    const totals = new Map();
    for (const row of stock) {
      if (itemId && String(row.itemId?._id) !== itemId) continue;
      if (warehouseId && String(row.warehouseId?._id) !== warehouseId) continue;
      const key = row.lotId?.packingKey || 'UNPACKED';
      const current = totals.get(key) || {
        value: key,
        name: row.lotId?.packingLabel || 'Unpacked',
        quantity: 0,
        uom: row.baseUom,
      };
      current.quantity += Number(row.available || 0);
      totals.set(key, current);
    }
    return [...totals.values()].filter(row => row.quantity > 0).map(row => ({
      value: row.value,
      label: `${row.name} · ${row.quantity} ${row.uom} available`,
    }));
  };
  const sourcePackingOptions = packingBuckets(packing.itemId, packing.warehouseId);
  const issuePackingOptions = packingBuckets(issue.itemId, issue.warehouseId);
  let parsedUnits = [];
  let unitLineError = null;
  if (receiptIsSerialized && receipt.unitLines.trim()) {
    try {
      parsedUnits = parseUnitLines(receipt.unitLines, receipt.manufacturedAt);
    } catch (error) {
      unitLineError = error.message;
    }
  }
  const parsedWeight = parsedUnits.reduce((total, unit) => total + unit.catchQuantity, 0);
  const receiptQuantity = Number(receipt.quantity);
  const hasValidSerializedQuantity = receiptIsSerialized
    && Number.isInteger(receiptQuantity)
    && receiptQuantity > 0
    && receiptQuantity <= 1000;
  const hasExactSerializedWeights = hasValidSerializedQuantity
    && !unitLineError
    && parsedUnits.length === receiptQuantity;
  const updateSerializedUnitLines = value => {
    const rowCount = String(value).split(/\r?\n/).map(line => line.trim()).filter(Boolean).length;
    if (rowCount > receiptQuantity) {
      Toast.error(`Only ${receiptQuantity} weight ${receiptQuantity === 1 ? 'value is' : 'values are'} allowed`);
      return;
    }
    setReceipt(current => ({ ...current, unitLines: value }));
  };

  const post = async (url, body, prefix, success) => {
    setSaving(true);
    try {
      const response = await axiosInstance.post(url, body, {
        headers: { 'Idempotency-Key': requestKey(prefix) },
      });
      Toast.success(response?.api?.message || success);
      return response;
    } catch (error) {
      Toast.error(apiMessage(error, success.replace('posted', 'failed')));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const receive = async event => {
    event.preventDefault();
    const quantity = Number(receipt.quantity);
    if (receiptIsSerialized && (unitLineError || parsedUnits.length !== quantity)) {
      Toast.error(unitLineError || `Enter exactly ${quantity} individual weight lines`);
      return;
    }
    const response = await post('/api/inventory-v2/receipts', {
      itemId: receipt.itemId,
      warehouseId: receipt.warehouseId,
      quantity,
      catchQuantity: receiptIsSerialized
        ? parsedWeight
        : (receipt.catchQuantity === '' ? undefined : Number(receipt.catchQuantity)),
      units: receiptIsSerialized ? parsedUnits : undefined,
      lotNo: receipt.lotNo || undefined,
      unitCost: Number(receipt.unitCost || 0),
      qualityStatus: 'AVAILABLE',
      processStatus: 'AVAILABLE',
      sourceType: 'MANUAL_RECEIPT',
      receiptMode: receipt.receiptMode,
      campaignId: receipt.receiptMode === 'OPENING_STOCK' ? undefined : receipt.campaignId,
      manufacturedAt: receipt.manufacturedAt || undefined,
      manualReason: receipt.manualReason,
      note: receipt.note,
    }, 'v2-receipt', 'Inventory receipt posted');
    if (!response) return;
    setCreatedSerials(response.api?.meta?.serials || []);
    setReceipt(current => ({
      ...current,
      itemId: '', quantity: '', catchQuantity: '', unitLines: '', lotNo: '',
      unitCost: '0', note: '', manualReason: '', manufacturedAt: localDateTime(),
    }));
    await load();
  };

  const pack = async event => {
    event.preventDefault();
    const rows = packing.components.filter(row => row.itemId && Number(row.quantity) > 0)
      .map(row => ({ itemId: row.itemId, quantityPerUnit: Number(row.quantity) }));
    const response = await post('/api/inventory-v2/blanket-packings', {
      itemId: packing.itemId,
      warehouseId: packing.warehouseId,
      fromPackingKey: packing.fromPackingKey,
      quantity: Number(packing.quantity),
      packingLabel: packing.packingLabel,
      packagingWarehouseId: packing.packagingWarehouseId,
      packaging: rows,
      note: `Packed as ${packing.packingLabel}`,
    }, 'blanket-packing', 'Blanket packing posted');
    if (!response) return;
    setPacking(current => ({
      ...current, itemId: '', fromPackingKey: 'UNPACKED', quantity: '',
      packingLabel: '', components: [{ itemId: '', quantity: '1' }],
    }));
    await load();
  };

  const issueStock = async event => {
    event.preventDefault();
    const quantity = Number(issue.quantity);
    const isBlanket = selectedIssueItem?.familyId?.code === 'BLANKET';
    const response = await post('/api/inventory-v2/issues', {
      itemId: issue.itemId,
      warehouseId: issue.warehouseId,
      quantity,
      packingKey: isBlanket ? issue.packingKey : undefined,
      processStatus: isBlanket ? (issue.packingKey === 'UNPACKED' ? 'AVAILABLE' : 'PACKED') : undefined,
      referenceType: issue.purpose === 'SALE' ? 'CUSTOMER_SALE' : 'MANUAL_ISSUE',
      referenceId: issue.referenceId || undefined,
      note: issue.note,
    }, 'v2-issue', issue.purpose === 'SALE' ? 'Customer stock issue posted' : 'Stock issue posted');
    if (!response) return;
    setIssue(current => ({
      ...current, itemId: '', packingKey: '', quantity: '', referenceId: '', note: '',
    }));
    await load();
  };

  const transferStock = async event => {
    event.preventDefault();
    if (transfer.fromWarehouseId === transfer.toWarehouseId) {
      Toast.error('Source and destination Warehouses must be different');
      return;
    }
    const response = await post('/api/inventory-v2/transfers', {
      itemId: transfer.itemId,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      quantity: Number(transfer.quantity),
      referenceType: 'WAREHOUSE_TRANSFER',
      note: transfer.note,
    }, 'v2-transfer', 'Inventory transfer posted');
    if (!response) return;
    setTransfer(current => ({ ...current, itemId: '', quantity: '', note: '' }));
    await load();
  };

  const tabs = [
    ['RECEIPT', 'Receive Stock'],
    ['PACK', 'Pack Blanket'],
    ['ISSUE', 'Issue / Sell'],
    ['TRANSFER', 'Transfer'],
  ];

  return (
    <div className="space-y-5 flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold">Inventory Operations</h1>
        <p className="mt-1 text-sm text-secondary-text">
          Receive manufactured units, then manage packing and stock movements by quantity.
        </p>
      </div>
      {createdSerials.length > 0 && (
        <SerialLabels serials={createdSerials} onClose={() => setCreatedSerials([])} />
      )}
      <div className="flex flex-wrap gap-2 border-b border-white-100">
        {tabs.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={cn(
            'border-b-2 px-4 py-2',
            tab === value ? 'border-blue-500 text-blue-500' : 'border-transparent',
          )}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'RECEIPT' && (
        <form onSubmit={receive} className="space-y-5 rounded-xl border border-white-100 p-5">
          <div>
            <h2 className="font-semibold">Manual controlled receipt</h2>
            <p className="mt-1 text-sm text-secondary-text">
              The gateway remains the normal production path. Manual posting requires a reason and individual weights.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <SelectInput
              label="Receipt reason/type"
              name="receiptMode"
              value={receipt.receiptMode}
              onChange={event => setReceipt(current => ({ ...current, receiptMode: event.target.value }))}
              options={[
                { value: 'PRODUCTION', label: 'Manual production receipt' },
                { value: 'GATEWAY_FALLBACK', label: 'Gateway downtime fallback' },
                { value: 'OPENING_STOCK', label: 'Verified opening stock' },
              ]}
              required
            />
            <AdaptiveSelectInput
              label="Item"
              name="v2ReceiptItem"
              placeholder="Select an item"
              value={receipt.itemId}
              onChange={event => setReceipt(current => ({
                ...current, itemId: event.target.value, quantity: '', catchQuantity: '', unitLines: '',
              }))}
              options={itemOptions}
              required
              force
            />
            <AdaptiveSelectInput
              label="Warehouse"
              name="v2ReceiptWarehouse"
              value={receipt.warehouseId}
              onChange={event => setReceipt(current => ({ ...current, warehouseId: event.target.value }))}
              options={warehouseOptions}
              required
            />
            {receipt.receiptMode !== 'OPENING_STOCK' && (
              <AdaptiveSelectInput
                label="Running campaign"
                name="v2ReceiptCampaign"
                value={receipt.campaignId}
                onChange={event => setReceipt(current => ({ ...current, campaignId: event.target.value }))}
                options={campaignOptions}
                placeholder="Select campaign"
                required
              />
            )}
            <CustomInput
              label={`Quantity${selectedReceiptItem ? ` (${selectedReceiptItem.baseUom})` : ''}`}
              name="v2ReceiptQuantity"
              type="number"
              min="1"
              max="1000"
              step={['roll', 'nos'].includes(selectedReceiptItem?.baseUom) ? '1' : 'any'}
              value={receipt.quantity}
              onChange={event => setReceipt(current => ({
                ...current,
                quantity: event.target.value,
                unitLines: current.quantity === event.target.value ? current.unitLines : '',
              }))}
              required
            />
            <CustomInput
              label="Manufactured at"
              name="v2ReceiptManufacturedAt"
              type="datetime-local"
              value={receipt.manufacturedAt}
              onChange={event => setReceipt(current => ({ ...current, manufacturedAt: event.target.value }))}
              required={receiptIsSerialized}
            />
            {!receiptIsSerialized && selectedReceiptItem?.catchMode !== 'NONE' && (
              <CustomInput
                label={`Measured quantity (${selectedReceiptItem?.catchUom || 'catch UOM'})`}
                name="v2ReceiptCatch"
                type="number"
                min="0.000001"
                step="any"
                value={receipt.catchQuantity}
                onChange={event => setReceipt(current => ({ ...current, catchQuantity: event.target.value }))}
                required={selectedReceiptItem?.catchMode === 'MEASURED'}
              />
            )}
            <CustomInput
              label="Lot number"
              name="v2ReceiptLot"
              value={receipt.lotNo}
              onChange={event => setReceipt(current => ({ ...current, lotNo: event.target.value }))}
              placeholder="Generated if blank"
            />
            <CustomInput
              label={`Unit cost per ${selectedReceiptItem?.baseUom || 'unit'}`}
              name="v2ReceiptCost"
              type="number"
              min="0"
              step="any"
              value={receipt.unitCost}
              onChange={event => setReceipt(current => ({ ...current, unitCost: event.target.value }))}
              required
            />
            <CustomInput
              label="Manual receipt reason"
              name="v2ReceiptReason"
              value={receipt.manualReason}
              onChange={event => setReceipt(current => ({ ...current, manualReason: event.target.value }))}
              placeholder="Why was the gateway/normal flow not used?"
              required={receiptIsSerialized}
            />
            <CustomInput
              label="Note"
              name="v2ReceiptNote"
              value={receipt.note}
              onChange={event => setReceipt(current => ({ ...current, note: event.target.value }))}
            />
          </div>
          {hasValidSerializedQuantity && (
            <div className="space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
              <label htmlFor="serialUnitLines" className="font-medium">
                Individual {selectedReceiptItem.catchUom || 'weight'} values — one roll per line
              </label>
              <p className="text-sm text-secondary-text">
                Enter exactly {receiptQuantity} scale {receiptQuantity === 1 ? 'reading' : 'readings'} as {receiptQuantity} {receiptQuantity === 1 ? 'line' : 'lines'}.
                {' '}Optional CSV format: weight, manufacture date/time.
                Serial numbers are assigned only by the backend.
              </p>
              <textarea
                id="serialUnitLines"
                className="min-h-48 w-full rounded-lg border border-white-100 bg-transparent p-3 font-mono"
                placeholder={'24.85\n25.10\n24.92'}
                value={receipt.unitLines}
                onChange={event => updateSerializedUnitLines(event.target.value)}
                required
              />
              <p className={cn('text-sm', unitLineError ? 'text-red-400' : 'text-secondary-text')}>
                {unitLineError || (
                  `${parsedUnits.length} of ${receiptQuantity} weights entered · `
                  + `${Math.max(receiptQuantity - parsedUnits.length, 0)} remaining · `
                  + `${parsedWeight.toFixed(3)} ${selectedReceiptItem.catchUom || ''} total`
                )}
              </p>
            </div>
          )}
          <SubmitButton
            loading={saving}
            disabled={receiptIsSerialized && !hasExactSerializedWeights}
            label="Validate, Post and Generate Serials"
          />
        </form>
      )}

      {tab === 'PACK' && (
        <form onSubmit={pack} className="space-y-5 rounded-xl border border-white-100 p-5">
          <h2 className="font-semibold">Pack or repack Blanket rolls</h2>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <AdaptiveSelectInput
              label="Blanket Item"
              name="packingItem"
              value={packing.itemId}
              onChange={event => setPacking(current => ({
                ...current, itemId: event.target.value, fromPackingKey: 'UNPACKED', quantity: '',
              }))}
              options={blanketItems.map(item => ({ value: String(item._id), label: `${item.sku} · ${item.name}` }))}
              required
            />
            <AdaptiveSelectInput
              label="Blanket Warehouse"
              name="packingBlanketWarehouse"
              value={packing.warehouseId}
              onChange={event => setPacking(current => ({
                ...current, warehouseId: event.target.value, fromPackingKey: 'UNPACKED', quantity: '',
              }))}
              options={warehouseOptions}
              required
            />
            <AdaptiveSelectInput
              label="Pack From"
              name="fromPackingKey"
              value={packing.fromPackingKey}
              onChange={event => setPacking(current => ({
                ...current, fromPackingKey: event.target.value, quantity: '',
              }))}
              options={sourcePackingOptions}
              placeholder="Select available packing bucket"
              required
            />
            <CustomInput
              label="Roll Quantity"
              name="packingRollQuantity"
              type="number"
              min="1"
              step="1"
              value={packing.quantity}
              onChange={event => setPacking(current => ({ ...current, quantity: event.target.value }))}
              required
            />
            <CustomInput
              label="Packing Name"
              name="packingLabel"
              placeholder="Plastic only / Box packed"
              value={packing.packingLabel}
              onChange={event => setPacking(current => ({ ...current, packingLabel: event.target.value }))}
              required
            />
            <AdaptiveSelectInput
              label="Packing Stock Warehouse"
              name="packingWarehouse"
              value={packing.packagingWarehouseId}
              onChange={event => setPacking(current => ({ ...current, packagingWarehouseId: event.target.value }))}
              options={warehouseOptions}
              required
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Packing material consumption per roll</h3>
              <button type="button" className="text-blue-500 hover:underline" onClick={() => setPacking(current => ({
                ...current, components: [...current.components, { itemId: '', quantity: '1' }],
              }))}>
                Add material
              </button>
            </div>
            {packing.components.map((row, index) => {
              const component = itemById.get(row.itemId);
              return (
                <div key={index} className="grid grid-cols-1 gap-x-4 rounded-lg border border-white-100 p-3 md:grid-cols-3">
                  <AdaptiveSelectInput
                    label="Packing Item"
                    name={`packingItem-${index}`}
                    value={row.itemId}
                    onChange={event => setPacking(current => ({
                      ...current,
                      components: current.components.map((line, rowIndex) =>
                        rowIndex === index ? { ...line, itemId: event.target.value } : line),
                    }))}
                    options={packagingItems.map(item => ({ value: String(item._id), label: `${item.sku} · ${item.name}` }))}
                    required
                  />
                  <CustomInput
                    label={`Quantity per roll${component ? ` (${component.baseUom})` : ''}`}
                    name={`packingQty-${index}`}
                    type="number"
                    min={component?.baseUom === 'nos' ? '1' : '0.000001'}
                    step={component?.baseUom === 'nos' ? '1' : 'any'}
                    value={row.quantity}
                    onChange={event => setPacking(current => ({
                      ...current,
                      components: current.components.map((line, rowIndex) =>
                        rowIndex === index ? { ...line, quantity: event.target.value } : line),
                    }))}
                    required
                  />
                  <button type="button" className="self-end py-2 text-red-400 hover:underline disabled:opacity-50"
                    disabled={packing.components.length === 1}
                    onClick={() => setPacking(current => ({
                      ...current, components: current.components.filter((_, rowIndex) => rowIndex !== index),
                    }))}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <SubmitButton loading={saving} label="Post Packing" />
        </form>
      )}

      {tab === 'ISSUE' && (
        <form onSubmit={issueStock} className="space-y-5 rounded-xl border border-white-100 p-5">
          <h2 className="font-semibold">Issue or sell stock</h2>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <SelectInput label="Purpose" name="issuePurpose" value={issue.purpose}
              onChange={event => setIssue(current => ({ ...current, purpose: event.target.value }))}
              options={[
                { value: 'ISSUE', label: 'Internal / manual issue' },
                { value: 'SALE', label: 'Customer sale dispatch' },
              ]}
              required
            />
            <AdaptiveSelectInput label="Item" name="v2IssueItem" value={issue.itemId}
              onChange={event => setIssue(current => ({
                ...current, itemId: event.target.value, packingKey: '', quantity: '',
              }))}
              options={itemOptions}
              required
            />
            <AdaptiveSelectInput label="Warehouse" name="v2IssueWarehouse" value={issue.warehouseId}
              onChange={event => setIssue(current => ({
                ...current, warehouseId: event.target.value,
              }))}
              options={warehouseOptions}
              required
            />
            {selectedIssueItem?.familyId?.code === 'BLANKET' && (
              <AdaptiveSelectInput label="Packing Type" name="v2IssuePacking" value={issue.packingKey}
                onChange={event => setIssue(current => ({
                  ...current, packingKey: event.target.value,
                }))}
                options={issuePackingOptions}
                required
              />
            )}
            <CustomInput label={`Quantity${selectedIssueItem ? ` (${selectedIssueItem.baseUom})` : ''}`}
              name="v2IssueQuantity" type="number" min="0.000001"
              step={['roll', 'nos'].includes(selectedIssueItem?.baseUom) ? '1' : 'any'}
              value={issue.quantity}
              onChange={event => setIssue(current => ({ ...current, quantity: event.target.value }))}
              required
            />
            <CustomInput label={issue.purpose === 'SALE' ? 'Customer / Invoice Reference' : 'Issue Reference'}
              name="v2IssueReference" value={issue.referenceId}
              onChange={event => setIssue(current => ({ ...current, referenceId: event.target.value }))}
              required={issue.purpose === 'SALE'}
            />
            <CustomInput label="Note" name="v2IssueNote" value={issue.note}
              onChange={event => setIssue(current => ({ ...current, note: event.target.value }))}
            />
          </div>
          <SubmitButton loading={saving} label={issue.purpose === 'SALE'
            ? 'Post Customer Issue'
            : 'Post Stock Issue'}
          />
        </form>
      )}

      {tab === 'TRANSFER' && (
        <form onSubmit={transferStock} className="space-y-5 rounded-xl border border-white-100 p-5">
          <div>
            <h2 className="font-semibold">Warehouse transfer</h2>
            <p className="mt-1 text-sm text-secondary-text">
              Move stock by quantity. Informational manufacturing serials are not used or changed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <AdaptiveSelectInput label="Item" name="v2TransferItem" value={transfer.itemId}
              onChange={event => setTransfer(current => ({
                ...current, itemId: event.target.value, quantity: '',
              }))}
              options={itemOptions}
              required
            />
            <AdaptiveSelectInput label="From Warehouse" name="v2TransferFrom"
              value={transfer.fromWarehouseId}
              onChange={event => setTransfer(current => ({
                ...current, fromWarehouseId: event.target.value, toWarehouseId: '',
              }))}
              options={warehouseOptions}
              required
            />
            <AdaptiveSelectInput label="To Warehouse" name="v2TransferTo"
              value={transfer.toWarehouseId}
              onChange={event => setTransfer(current => ({
                ...current, toWarehouseId: event.target.value,
              }))}
              options={warehouseOptions.filter(row => row.value !== transfer.fromWarehouseId)}
              required
            />
            <CustomInput
              label={`Quantity${selectedTransferItem ? ` (${selectedTransferItem.baseUom})` : ''}`}
              name="v2TransferQuantity"
              type="number"
              min="0.000001"
              step={['roll', 'nos'].includes(selectedTransferItem?.baseUom) ? '1' : 'any'}
              value={transfer.quantity}
              onChange={event => setTransfer(current => ({
                ...current, quantity: event.target.value,
              }))}
              required
            />
            <CustomInput label="Note" name="v2TransferNote" value={transfer.note}
              onChange={event => setTransfer(current => ({
                ...current, note: event.target.value,
              }))}
            />
          </div>
          <SubmitButton loading={saving} label="Post Transfer" />
        </form>
      )}
    </div>
  );
}
