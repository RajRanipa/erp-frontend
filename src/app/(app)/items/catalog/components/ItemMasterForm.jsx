'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import ItemLifecycleActions from '../components/ItemLifecycleActions';
import Loading from '@/Components/Loading';
import { Toast } from '@/Components/toast';
import {
  apiErrorMessage,
  apiMessage,
  itemMasterApi,
} from '../itemMasterApi';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import AdaptiveSelectInput from '@/Components/inputs/AdaptiveSelectInput';

const editableStatuses = new Set(['draft', 'returned']);

const inputValue = attribute =>
  attribute?.valueNumber
  ?? attribute?.valueBoolean
  ?? (attribute?.valueDate ? String(attribute.valueDate).slice(0, 10) : null)
  ?? attribute?.valueRef
  ?? attribute?.valueString
  ?? '';

export default function ItemMasterForm({ itemId = null, ItemLifecycleHTML=false }) {
  const router = useRouter();
  const [setup, setSetup] = useState(null);
  const [schema, setSchema] = useState(null);
  const [item, setItem] = useState(null);
  const [referenceOptions, setReferenceOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    familyId: '',
    sku: '',
    name: '',
    description: '',
    minimumStock: 0,
    attributes: {},
  });

  const editable = !item || editableStatuses.has(item.status);
  const activeFamilies = useMemo(
    () => (setup?.families || []).filter(family => family.status === 'active'),
    [setup],
  );

  const loadFamily = useCallback(async (familyId, existingItem = null) => {
    if (!familyId) {
      setSchema(null);
      return;
    }
    const nextSchema = await itemMasterApi.form(familyId);
    setSchema(nextSchema);
    const existing = Object.fromEntries(
      (existingItem?.attributes || []).map(attribute => [attribute.code, inputValue(attribute)]),
    );
    setForm(current => ({
      ...current,
      familyId,
      attributes: Object.fromEntries(
        nextSchema.attributes.map(attribute => [
          attribute.code,
          existing[attribute.code] ?? attribute.defaultValue ?? '',
        ]),
      ),
    }));

    const references = nextSchema.attributes.filter(
      attribute => attribute.dataType === 'reference' && attribute.referenceFamilyCode,
    );
    const loadedOptions = await Promise.all(
      references.map(async attribute => [
        attribute.code,
        await itemMasterApi.options({ familyCode: attribute.referenceFamilyCode }),
      ]),
    );
    setReferenceOptions(Object.fromEntries(loadedOptions));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const nextSetup = await itemMasterApi.setup();
        const existingItem = itemId ? await itemMasterApi.get(itemId) : null;
        if (!alive) return;
        setSetup(nextSetup);
        setItem(existingItem);
        if (existingItem) {
          setForm(current => ({
            ...current,
            familyId: existingItem.familyId?._id || existingItem.familyId,
            sku: existingItem.sku || '',
            name: existingItem.name || '',
            description: existingItem.description || '',
            minimumStock: existingItem.minimumStock ?? 0,
          }));
          await loadFamily(
            existingItem.familyId?._id || existingItem.familyId,
            existingItem,
          );
        }
      } catch (error) {
        Toast.error(apiErrorMessage(error, 'Unable to load Item Master'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId, loadFamily]);

  const setField = (field, value) =>
    setForm(current => ({ ...current, [field]: value }));
  const setAttribute = (code, value) =>
    setForm(current => ({
      ...current,
      attributes: { ...current.attributes, [code]: value },
    }));

  const handleFamilyChange = async event => {
    const familyId = event.target.value;
    // SelectTypeInput emits once when it synchronizes its displayed label.
    // That is not a user change. Reloading the same family without the
    // existing Item would replace every hydrated specification with defaults.
    if (String(familyId) === String(form.familyId)) return;
    setField('familyId', familyId);
    try {
      await loadFamily(familyId);
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to load Item Family'));
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.familyId || !form.name.trim()) {
      Toast.error('Item Family and Item Name are required');
      return;
    }
    setSaving(true);
    try {
      const response = itemId
        ? await itemMasterApi.update(itemId, form)
        : await itemMasterApi.create(form);
      const saved = response.data;
      Toast.success(apiMessage(response, itemId ? 'Item updated' : 'Item created as Draft'));
      router.push(`/items/catalog/${saved?._id || itemId}`);
      router.refresh();
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to save Item'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading Item form">
        <Loading variant="skeleton" className="h-12" />
        <Loading variant="skeleton" className="h-40" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col gap-3">
      <section className="rounded-xl border border-white-100 bg-white-50 p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-primary-text">
              {itemId ? 'Item Master Record' : 'Create Item Master'}
            </h1>
            <p className="mt-1 text-sm text-secondary-text">
              The selected family controls identity, UOM, tracking and workflow rules.
            </p>
          </div>
          <div className='flex gap-3 items-center'>
          {item?.status && (
            <span className="rounded-full border border-white-200 px-3 py-1 text-sm capitalize">
              {item.status.replaceAll('_', ' ')}
            </span>
          )}
          {ItemLifecycleHTML && <ItemLifecycleActions item={item} /> }
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 xl:grid-cols-4">
          <SelectTypeInput
            label="Item Family"
            name="familyId"
            placeholder="Select family"
            value={form.familyId}
            onChange={handleFamilyChange}
            options={activeFamilies.map(family => ({
              value: family._id,
              label: `<div class="flex flex-col items-start"><span>${family.name}</span> <span class="text-sm text-white-400"> ${family.itemClassId?.name || ''} </span> </div>`,
            }))}
            required
            disabled={!editable}
          />
          <CustomInput
            label="Item Name"
            name="name"
            value={form.name}
            onChange={event => setField('name', event.target.value)}
            required
            disabled={!editable}
          />
          <CustomInput
            label="SKU"
            name="sku"
            value={form.sku}
            placeholder="Auto-generated when blank"
            onChange={event => setField('sku', event.target.value)}
            disabled={!editable}
          />
          <CustomInput
            label={`Minimum Stock${schema?.uomPolicy?.baseUom ? ` (${schema.uomPolicy.baseUom})` : ''}`}
            name="minimumStock"
            type="number"
            min="0"
            step="any"
            value={form.minimumStock}
            onChange={event => setField('minimumStock', event.target.value)}
            disabled={!editable}
          />
        </div>
        <CustomInput
          label="Description"
          name="description"
          value={form.description}
          onChange={event => setField('description', event.target.value)}
          disabled={!editable}
        />
      </section>

      {schema && (
        <section className="rounded-xl border border-white-100 bg-white-50 p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-primary-text">{schema.name} specifications</h2>
            <p className="mt-1 text-sm text-secondary-text">
              Identity attributes become immutable after review. Base UOM: {schema.uomPolicy.baseUom}
              {schema.uomPolicy.catchUom ? ` · Catch UOM: ${schema.uomPolicy.catchUom}` : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 xl:grid-cols-3">
            {schema.attributes.map(attribute => {
              const common = {
                label: `${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ''}`,
                name: attribute.code,
                value: form.attributes[attribute.code] ?? '',
                required: attribute.required,
                disabled: !editable,
              };
              if (attribute.dataType === 'select') {
                const options = (attribute.allowedValues || [])
                  .filter(option => option.active !== false)
                  .map(option => ({ value: option.value, label: option.label }));
                return (
                  <AdaptiveSelectInput
                    key={attribute.code}
                    {...common}
                    placeholder={`Select ${attribute.label}`}
                    options={options}
                    onChange={event => setAttribute(attribute.code, event.target.value)}
                  />
                );
              }
              if (attribute.dataType === 'reference') {
                return (
                  <AdaptiveSelectInput
                    key={attribute.code}
                    {...common}
                    placeholder={`Select ${attribute.label}`}
                    options={referenceOptions[attribute.code] || []}
                    onChange={event => setAttribute(attribute.code, event.target.value)}
                  />
                );
              }
              if (attribute.dataType === 'boolean') {
                return (
                  <SelectInput
                    key={attribute.code}
                    {...common}
                    placeholder={`Select ${attribute.label}`}
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                    onChange={event => setAttribute(attribute.code, event.target.value)}
                  />
                );
              }
              return (
                <CustomInput
                  key={attribute.code}
                  {...common}
                  type={attribute.dataType === 'number' ? 'number' : attribute.dataType}
                  min={attribute.validation?.min ?? undefined}
                  max={attribute.validation?.max ?? undefined}
                  step={attribute.dataType === 'number' ? 'any' : undefined}
                  onChange={event => setAttribute(attribute.code, event.target.value)}
                />
              );
            })}
          </div>
        </section>
      )}

      {!editable && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Identity is locked after review. Use lifecycle actions or create a new Item revision.
        </div>
      )}
      {editable && <SubmitButton loading={saving} label={itemId ? 'Save Item' : 'Create Draft'} className='w-fit'/>}
    </form>
  );
}
