'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { axiosInstance } from '@/lib/axiosInstance';

export default function CreateProductionOrderPage() {
  const router = useRouter();
  const { list: warehouses } = useWarehouses();
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    outputItemId: '',
    recipeId: '',
    plannedQuantity: '',
    sourceWarehouseId: '',
    outputWarehouseId: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/item-master/items', {
        params: { status: 'active', manufacturable: 'true', limit: 100 },
      }),
      axiosInstance.get('/api/manufacturing-v2/recipes', { params: { status: 'ACTIVE' } }),
    ]).then(([itemResponse, recipeResponse]) => {
      setItems(itemResponse.data || []);
      setRecipes(recipeResponse.data || []);
    }).catch(error => {
      Toast.error(error?.response?.data?.message || 'Unable to load manufacturing setup');
    });
  }, []);

  const availableRecipes = useMemo(
    () => recipes.filter(recipe =>
      String(recipe.outputItemId?._id || recipe.outputItemId) === form.outputItemId
    ),
    [recipes, form.outputItemId],
  );
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/manufacturing-v2/orders', form);
      Toast.success(response?.api?.message || 'Production Order created');
      router.push(`/manufacturing/orders/${response.data._id}`);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Unable to create Production Order');
    } finally {
      setSaving(false);
    }
  };
  const warehouseOptions = warehouses.map(warehouse => ({
    value: warehouse._id,
    label: `${warehouse.code || ''} · ${warehouse.name}`,
  }));

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Create Production Order</h1>
        <p className="mt-1 text-sm text-secondary-text">
          Requirements are frozen from the selected active recipe.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-5 rounded-xl border border-white-100 p-5 md:grid-cols-2">
        <AdaptiveSelectInput
          label="Output Item"
          name="outputItemId"
          placeholder="Select manufacturable Item"
          value={form.outputItemId}
          onChange={event => setForm(current => ({
            ...current,
            outputItemId: event.target.value,
            recipeId: '',
          }))}
          options={items.map(item => ({
            value: item._id,
            label: `${item.sku} · ${item.name}`,
          }))}
          required
        />
        <AdaptiveSelectInput
          label="Active Recipe"
          name="recipeId"
          placeholder="Select recipe"
          value={form.recipeId}
          onChange={event => set('recipeId', event.target.value)}
          options={availableRecipes.map(recipe => ({
            value: recipe._id,
            label: `${recipe.code} · Rev ${recipe.revision}`,
          }))}
          required
        />
        <CustomInput
          label="Planned Quantity"
          name="plannedQuantity"
          type="number"
          min="0.000001"
          step="any"
          value={form.plannedQuantity}
          onChange={event => set('plannedQuantity', event.target.value)}
          required
        />
        <AdaptiveSelectInput
          label="Material Warehouse"
          name="sourceWarehouseId"
          placeholder="Select warehouse"
          value={form.sourceWarehouseId}
          onChange={event => set('sourceWarehouseId', event.target.value)}
          options={warehouseOptions}
          required
        />
        <AdaptiveSelectInput
          label="Output Warehouse"
          name="outputWarehouseId"
          placeholder="Select warehouse"
          value={form.outputWarehouseId}
          onChange={event => set('outputWarehouseId', event.target.value)}
          options={warehouseOptions}
          required
        />
        <CustomInput
          label="Notes"
          name="notes"
          value={form.notes}
          onChange={event => set('notes', event.target.value)}
        />
      </div>
      <SubmitButton loading={saving} label="Create Draft Order" />
    </form>
  );
}
