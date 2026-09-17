'use client';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';

import { useCallback, useEffect, useState } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import Table from '@/Components/layout/Table';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import useAuthz from '@/hooks/useAuthz';

const emptyComponent = () => ({
  itemId: '',
  quantity: '',
  scrapPercent: 0,
  stage: 'RELEASE',
});

export default function ManufacturingRecipesPage() {
  const { can } = useAuthz();
  const [recipes, setRecipes] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [components, setComponents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    outputItemId: '',
    code: '',
    name: '',
    revision: 1,
    basisQuantity: 1,
    expectedYieldPercent: 100,
    components: [emptyComponent()],
  });
  const selectedOutput = outputs.find(item => String(item._id) === String(form.outputItemId));

  const load = useCallback(async () => {
    try {
      const [recipeResponse, outputResponse, componentResponse] = await Promise.all([
        axiosInstance.get('/api/manufacturing/recipes'),
        axiosInstance.get('/api/item-master/items', {
          params: { status: 'active', manufacturable: 'true', limit: 100 },
        }),
        axiosInstance.get('/api/item-master/items', {
          params: { status: 'active', consumable: 'true', limit: 100 },
        }),
      ]);
      setRecipes(recipeResponse.data || []);
      setOutputs(outputResponse.data || []);
      setComponents(componentResponse.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to load Recipes');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const updateComponent = (index, patch) =>
    setForm(current => ({
      ...current,
      components: current.components.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      ),
    }));
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/manufacturing/recipes', form);
      Toast.success(response?.api?.message || 'Recipe created');
      setForm({
        outputItemId: '',
        code: '',
        name: '',
        revision: 1,
        basisQuantity: 1,
        expectedYieldPercent: 100,
        components: [emptyComponent()],
      });
      await load();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to create Recipe');
    } finally {
      setSaving(false);
    }
  };
  const activate = async id => {
    try {
      const response = await axiosInstance.patch(`/api/manufacturing/recipes/${id}/activate`);
      Toast.success(response?.api?.message || 'Recipe activated');
      await load();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to activate Recipe');
    }
  };

  const columns = [
    { key: 'code', header: 'Code' },
    {
      key: 'output',
      header: 'Output Item',
      render: row => `${row.outputItemId?.sku || ''} · ${row.outputItemId?.name || ''}`,
    },
    { key: 'revision', header: 'Revision', align: 'right' },
    {
      key: 'basis',
      header: 'Basis',
      render: row => `${row.basisQuantity} ${row.outputUom}`,
    },
    { key: 'status', header: 'Status' },
    {
      key: 'action',
      header: 'Action',
      render: row => row.status === 'DRAFT' && can('production:update')
        ? (
          <button className="text-blue-500 hover:underline" onClick={() => activate(row._id)}>
            Activate
          </button>
        )
        : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Manufacturing Recipes</h1>
        <p className="mt-1 text-sm text-secondary-text">
          Versioned formulas define raw consumption and packing materials; nothing is hardcoded by thickness.
        </p>
      </div>
      {can('production:create') && (
      <form onSubmit={submit} className="space-y-5 rounded-xl border border-white-100 p-5">
        <h2 className="font-semibold">New recipe revision</h2>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
          <AdaptiveSelectInput
            label="Output Item"
            name="recipeOutput"
            placeholder="Select output"
            value={form.outputItemId}
            onChange={event => set('outputItemId', event.target.value)}
            options={outputs.map(item => ({
              value: item._id,
              label: `${item.sku} · ${item.name}`,
            }))}
            required
          />
          <CustomInput
            label="Recipe Code"
            name="recipeCode"
            value={form.code}
            onChange={event => set('code', event.target.value)}
            required
          />
          <CustomInput
            label="Recipe Name"
            name="recipeName"
            value={form.name}
            onChange={event => set('name', event.target.value)}
            required
          />
          <CustomInput
            label="Revision"
            name="recipeRevision"
            type="number"
            min="1"
            step="1"
            value={form.revision}
            onChange={event => set('revision', event.target.value)}
            required
          />
          <CustomInput
            label="Output Basis Quantity"
            name="basisQuantity"
            type="number"
            min="0.000001"
            step="any"
            value={form.basisQuantity}
            onChange={event => set('basisQuantity', event.target.value)}
            required
          />
          <CustomInput
            label="Expected Yield %"
            name="expectedYieldPercent"
            type="number"
            min="0.01"
            max="100"
            step="any"
            value={form.expectedYieldPercent}
            onChange={event => set('expectedYieldPercent', event.target.value)}
            required
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Material components</h3>
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => setForm(current => ({
                ...current,
                components: [...current.components, emptyComponent()],
              }))}
            >
              Add component
            </button>
          </div>
          {selectedOutput?.familyId?.code === 'BLANKET' && (
            <p className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm text-secondary-text">
              Blanket recipes must include exactly one Plastic Bag per output roll. Select the
              PLASTIC_BAG Item, set “Consume at” to Packing, and make its quantity equal to the
              output basis quantity. Accepted PLC rolls will consume this material automatically.
            </p>
          )}
          {form.components.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-x-3 rounded-lg border border-white-100 p-3 md:grid-cols-4">
              <AdaptiveSelectInput
                label="Item"
                name={`component-${index}`}
                placeholder="Select material"
                value={row.itemId}
                onChange={event => updateComponent(index, { itemId: event.target.value })}
                options={components.map(item => ({
                  value: item._id,
                  label: `${item.sku} · ${item.name}`,
                }))}
                required
              />
              <CustomInput
                label="Quantity per basis"
                name={`componentQty-${index}`}
                type="number"
                min="0.000001"
                step="any"
                value={row.quantity}
                onChange={event => updateComponent(index, { quantity: event.target.value })}
                required
              />
              <AdaptiveSelectInput
                label="Consume at"
                name={`componentStage-${index}`}
                value={row.stage}
                onChange={event => updateComponent(index, { stage: event.target.value })}
                options={[
                  { value: 'RELEASE', label: 'Batch release' },
                  { value: 'PACKING', label: 'Packing' },
                ]}
                required
              />
              <CustomInput
                label="Scrap allowance %"
                name={`componentScrap-${index}`}
                type="number"
                min="0"
                max="100"
                step="any"
                value={row.scrapPercent}
                onChange={event => updateComponent(index, { scrapPercent: event.target.value })}
              />
            </div>
          ))}
        </div>
        <SubmitButton loading={saving} label="Create Draft Recipe" />
      </form>
      )}
      <Table
        columns={columns}
        data={recipes}
        rowKey={row => row._id}
        pageSize={25}
        emptyMessage="No Recipes have been configured."
      />
    </div>
  );
}
