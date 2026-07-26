'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectTypeInput from '@/Components/inputs/SelectTypeInput';
import NavLink from '@/Components/NavLink';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { useWarehouses } from '@/hooks/useWarehouses';
// import Manufacturing from '../page';
import WarehouseSelect from '@/app/(app)/inventory/components/WarehouseSelect';
import { addIcon } from '@/utils/SVG';
import DeleteButton from '@/Components/buttons/DeleteButton';
import AddButton from '@/Components/buttons/AddButton';

const createMaterialRow = (rowId) => ({
    rowId,
    revision: 0,
    materialId: '',
    materialLabel: '',
    weight: '',
});

const localToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const escapeHtml = (value) =>
    String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const normalizeMaterialOptions = (rows) => {
    if (!Array.isArray(rows)) return [];

    return rows
        .filter((item) => item?._id && item?.status !== 'archived')
        .map((item) => {
            const details = [item.grade, item.UOM].filter(Boolean).join(' · ');
            const label = details ? `${item.name} — ${details}` : item.name;

            return {
                value: String(item._id),
                label: escapeHtml(label || item.sku || item._id),
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
};

const parsePositiveNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
};

const validateMaterial = (row) => {
    const errors = {};

    if (!row.materialId) {
        errors.materialId = 'Raw material is required';
    }

    if (row.weight === '' || row.weight === null || row.weight === undefined) {
        errors.weight = 'Weight is required';
    } else if (!Number.isFinite(Number(row.weight))) {
        errors.weight = 'Weight must be a number';
    } else if (Number(row.weight) <= 0) {
        errors.weight = 'Weight must be greater than 0';
    }

    return errors;
};

const buildBatchId = ({ numberOfBatches, materials, date, nonce }) => {
    const count = Number.isInteger(Number(numberOfBatches))
        ? String(numberOfBatches)
        : '0';

    const totalWeight = materials.reduce(
        (sum, row) => sum + (parsePositiveNumber(row.weight) || 0),
        0,
    );

    const materialParts = materials
        .filter((row) => row.materialId && parsePositiveNumber(row.weight))
        .map((row) => {
            const cleanName = row.materialLabel
                .split('—')[0]
                .trim()
                .replace(/[^a-z0-9]+/gi, '');
            const materialCode = cleanName.slice(0, 3).toUpperCase() || 'RAW';
            const percentage =
                totalWeight > 0 ? Math.round((Number(row.weight) / totalWeight) * 100) : 0;
            return `${materialCode}${percentage}`;
        });

    const [year = '0000', month = '00', day = '00'] = String(date || '').split('-');
    const dateToken = `${day}${month}${year}`;

    return [`B${count}`, ...materialParts, dateToken, nonce || '000000000']
        .filter(Boolean)
        .join('-');
};

function MaterialRow({
    index,
    row,
    options,
    optionsVersion,
    error,
    touched,
    onMaterialChange,
    onWeightChange,
    onBlur,
    onAdd,
    onRemove,
    canRemove,
}) {
    console.log('MaterialRow error', error?.materialId);
    console.log('MaterialRow touched', touched?.materialId);
    return (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <SelectTypeInput
                key={`${row.rowId}-${row.revision}-${optionsVersion}`}
                placeholder="Select raw material"
                label="Raw material"
                name={`material_${row.rowId}`}
                value={row.materialId}
                onChange={(event) => onMaterialChange(index, event)}
                onBlur={() => onBlur(index, 'materialId')}
                required
                options={options}
                allowCustomValue={false}
                err={touched?.materialId ? error?.materialId : ''}
            />

            <CustomInput
                type="number"
                min="0.001"
                placeholder="Weight per batch"
                label="Weight per batch (kg)"
                name={`weight_${row.rowId}`}
                value={row.weight}
                onChange={(event) => onWeightChange(index, event.target.value)}
                onBlur={() => onBlur(index, 'weight')}
                required
                err={touched?.weight ? error?.weight : ''}
            />

            <div className="flex gap-2 pt-0 md:pt-6">
                <AddButton
                    type="iconButton"
                    onClick={onAdd}
                    className="rounded-lg text-xl "
                    aria-label="Add another raw material"
                    title=""
                />

                {canRemove && (
                    <DeleteButton
                        type="button"
                        onClick={() => onRemove(index)}
                        className="rounded-lg p-2 shadow-md text-xl"
                        aria-label="Remove raw material"
                        title="Remove raw material"
                    />

                )}
            </div>
        </div>
    );
}

export default function RawMaterialsBatchPage() {
    const router = useRouter();
    const nextRowId = useRef(2);

    const [activeCampaign, setActiveCampaign] = useState({
        _id: null,
        name: null,
        status: null,
    });
    const [numberOfBatches, setNumberOfBatches] = useState('');
    const [batchDate, setBatchDate] = useState(localToday);
    const [warehouseId, setWarehouseId] = useState('');
    const [materials, setMaterials] = useState(() => [createMaterialRow(1)]);
    const [batchNonce, setBatchNonce] = useState('');
    const [materialOptions, setMaterialOptions] = useState([]);
    const [optionsVersion, setOptionsVersion] = useState(0);
    const [loadingMaterials, setLoadingMaterials] = useState(true);
    const [materialsError, setMaterialsError] = useState('');
    const [errors, setErrors] = useState({ materials: [] });
    const [touched, setTouched] = useState({ materials: [] });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const {
        loading: loadingWarehouses,
        list: warehouses,
        error: warehousesError,
    } = useWarehouses();

    const warehouseOptions = useMemo(
        () =>
            warehouses.map((warehouse) => ({
                value: String(warehouse._id),
                label: warehouse.code
                    ? `${warehouse.name} (${warehouse.code})`
                    : warehouse.name,
            })),
        [warehouses],
    );

    const refreshNonce = useCallback(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        setBatchNonce(`${hours}${minutes}${seconds}${milliseconds}`);
    }, []);

    useEffect(() => {
        active();
    }, [])
    const active = async () => {
        try {

            const { data } = await axiosInstance.get('/api/campaigns/active');
            setActiveCampaign(data[0]);
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        refreshNonce();
    }, [refreshNonce]);

    useEffect(() => {
        const controller = new AbortController();

        const loadRawMaterials = async () => {
            setLoadingMaterials(true);
            setMaterialsError('');

            try {
                const response = await axiosInstance.get('/api/items/raw', {
                    params: { status: 'active' },
                    signal: controller.signal,
                });
                const options = normalizeMaterialOptions(response?.data);
                setMaterialOptions(options);
                setOptionsVersion((version) => version + 1);

                if (options.length === 0) {
                    setMaterialsError('No raw-material items are available.');
                }
            } catch (error) {
                if (
                    error?.code === 'ERR_CANCELED' ||
                    error?.name === 'CanceledError' ||
                    error?.name === 'AbortError'
                ) {
                    return;
                }

                setMaterialOptions([]);
                setMaterialsError(
                    error?.response?.data?.message || 'Failed to load raw materials.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingMaterials(false);
                }
            }
        };

        loadRawMaterials();
        return () => controller.abort();
    }, []);

    const totalWeightPerBatch = useMemo(
        () =>
            materials.reduce(
                (sum, row) => sum + (parsePositiveNumber(row.weight) || 0),
                0,
            ),
        [materials],
    );

    const totalPlannedWeight = useMemo(() => {
        const count = parsePositiveNumber(numberOfBatches) || 0;
        return totalWeightPerBatch * count;
    }, [numberOfBatches, totalWeightPerBatch]);

    const batchId = useMemo(
        () =>
            buildBatchId({
                numberOfBatches,
                materials,
                date: batchDate,
                nonce: batchNonce,
            }),
        [numberOfBatches, materials, batchDate, batchNonce],
    );

    const validateForm = useCallback(() => {
        const nextErrors = { materials: materials.map(validateMaterial) };
        const count = Number(numberOfBatches);

        if (numberOfBatches === '') {
            nextErrors.numberOfBatches = 'Number of batches is required';
        } else if (!Number.isInteger(count)) {
            nextErrors.numberOfBatches = 'Number of batches must be a whole number';
        } else if (count <= 0) {
            nextErrors.numberOfBatches = 'Number of batches must be greater than 0';
        }

        if (!batchDate) {
            nextErrors.batchDate = 'Date is required';
        } else {
            const parsedDate = new Date(`${batchDate}T00:00:00`);
            if (Number.isNaN(parsedDate.getTime())) {
                nextErrors.batchDate = 'Enter a valid date';
            }
        }

        if (!activeCampaign?._id) {
            nextErrors.campaign = 'Select a campaign before creating a batch';
        }
        if (!warehouseId) {
            nextErrors.warehouseId = 'Source warehouse is required';
        }

        const seen = new Map();
        materials.forEach((row, index) => {
            if (!row.materialId) return;
            if (seen.has(row.materialId)) {
                const firstIndex = seen.get(row.materialId);
                nextErrors.materials[index] = {
                    ...nextErrors.materials[index],
                    materialId: 'This raw material is already added',
                };
                nextErrors.materials[firstIndex] = {
                    ...nextErrors.materials[firstIndex],
                    materialId: 'This raw material is already added',
                };
            } else {
                seen.set(row.materialId, index);
            }
        });

        return nextErrors;
    }, [
        activeCampaign?._id,
        batchDate,
        materials,
        numberOfBatches,
        warehouseId,
    ]);

    const hasErrors = (nextErrors) =>
        Boolean(
            nextErrors.numberOfBatches ||
            nextErrors.batchDate ||
            nextErrors.campaign ||
            nextErrors.warehouseId ||
            nextErrors.materials?.some((row) => Object.keys(row || {}).length > 0),
        );

    const updateMaterialRow = useCallback((index, patch) => {
        setMaterials((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
        setFormError('');
    }, []);

    const handleMaterialChange = useCallback(
        (index, event) => {
            const materialId = String(event?.target?.value || '');
            const materialLabel = String(event?.label?.value || '');
            const duplicate = materials.some(
                (row, rowIndex) =>
                    rowIndex !== index && row.materialId && row.materialId === materialId,
            );

            if (materialId && duplicate) {
                setMaterials((current) =>
                    current.map((row, rowIndex) =>
                        rowIndex === index
                            ? {
                                ...row,
                                materialId: '',
                                materialLabel: '',
                                revision: row.revision + 1,
                            }
                            : row,
                    ),
                );
                setErrors((current) => {
                    const materialErrors = [...(current.materials || [])];
                    materialErrors[index] = {
                        ...(materialErrors[index] || {}),
                        materialId: 'This raw material is already added',
                    };
                    return { ...current, materials: materialErrors };
                });
                setTouched((current) => {
                    const materialTouched = [...(current.materials || [])];
                    materialTouched[index] = {
                        ...(materialTouched[index] || {}),
                        materialId: true,
                    };
                    return { ...current, materials: materialTouched };
                });
                return;
            }

            updateMaterialRow(index, { materialId, materialLabel });
            setErrors((current) => {
                const materialErrors = [...(current.materials || [])];
                const rowErrors = { ...(materialErrors[index] || {}) };
                delete rowErrors.materialId;
                materialErrors[index] = rowErrors;
                return { ...current, materials: materialErrors };
            });
        },
        [materials, updateMaterialRow],
    );

    const handleWeightChange = useCallback(
        (index, weight) => {
            updateMaterialRow(index, { weight });
            setErrors((current) => {
                const materialErrors = [...(current.materials || [])];
                const rowErrors = {
                    ...(materialErrors[index] || {}),
                    ...validateMaterial({ ...materials[index], weight }),
                };
                if (!validateMaterial({ ...materials[index], weight }).weight) {
                    delete rowErrors.weight;
                }
                materialErrors[index] = rowErrors;
                return { ...current, materials: materialErrors };
            });
        },
        [materials, updateMaterialRow],
    );

    const handleMaterialBlur = useCallback((index, field) => {
        setTouched((current) => {
            const materialTouched = [...(current.materials || [])];
            materialTouched[index] = {
                ...(materialTouched[index] || {}),
                [field]: true,
            };
            return { ...current, materials: materialTouched };
        });

        setErrors((current) => {
            const materialErrors = [...(current.materials || [])];
            materialErrors[index] = validateMaterial(materials[index]);
            return { ...current, materials: materialErrors };
        });
    }, [materials]);

    const addMaterial = useCallback(() => {
        const rowErrors = materials.map(validateMaterial);
        if (rowErrors.some((row) => Object.keys(row).length > 0)) {
            setErrors((current) => ({ ...current, materials: rowErrors }));
            setTouched((current) => ({
                ...current,
                materials: materials.map(() => ({ materialId: true, weight: true })),
            }));
            setFormError(
                'Complete the existing raw-material rows before adding another.',
            );
            return;
        }

        const rowId = nextRowId.current;
        nextRowId.current += 1;
        setMaterials((current) => [...current, createMaterialRow(rowId)]);
        setErrors((current) => ({
            ...current,
            materials: [...(current.materials || []), {}],
        }));
        setTouched((current) => ({
            ...current,
            materials: [...(current.materials || []), {}],
        }));
        setFormError('');
    }, [materials]);

    const removeMaterial = useCallback((index) => {
        setMaterials((current) => current.filter((_, rowIndex) => rowIndex !== index));
        setErrors((current) => ({
            ...current,
            materials: (current.materials || []).filter(
                (_, rowIndex) => rowIndex !== index,
            ),
        }));
        setTouched((current) => ({
            ...current,
            materials: (current.materials || []).filter(
                (_, rowIndex) => rowIndex !== index,
            ),
        }));
        setFormError('');
    }, []);

    const resetForm = useCallback(() => {
        nextRowId.current = 2;
        setNumberOfBatches('');
        setBatchDate(localToday());
        setWarehouseId('');
        setMaterials([createMaterialRow(1)]);
        setErrors({ materials: [] });
        setTouched({ materials: [] });
        setFormError('');
        refreshNonce();
    }, [refreshNonce]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

        const nextErrors = validateForm();
        setErrors(nextErrors);
        setTouched({
            numberOfBatches: true,
            batchDate: true,
            campaign: true,
            warehouseId: true,
            materials: materials.map(() => ({ materialId: true, weight: true })),
        });

        if (hasErrors(nextErrors)) {
            setFormError('Please correct the highlighted fields.');
            return;
        }

        if (loadingMaterials || materialsError) {
            setFormError(materialsError || 'Raw materials are still loading.');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const payload = {
                date: batchDate,
                numbersBatches: Number(numberOfBatches),
                batche_id: batchId,
                campaign: activeCampaign._id,
                warehouseId,
                rawMaterials: materials.map((row) => ({
                    itemId: row.materialId,
                    weight: Number(row.weight),
                    unit: 'kg',
                })),
            };

            const response = await axiosInstance.post('/api/batches', payload);
            Toast.success(response?.data?.message || 'Raw-material batch added');
            resetForm();
            router.push('/manufacturing/batches/view');
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'Failed to add raw-material batch';
            setFormError(message);
            Toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        // <Manufacturing>
        <div className="w-full space-y-4">
            <div>
                <h1 className="text-xl font-semibold">Add Raw Materials Batch</h1>
                <p className="mt-1 text-sm text-white-500">
                    Enter material weight for one batch. Planned usage is multiplied by
                    the number of batches.
                </p>
            </div>

            {!activeCampaign?._id && (
                <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4">
                    <p className="font-medium text-yellow-300">
                        No campaign is selected.
                    </p>
                    <p className="mt-1 text-sm text-white-500">
                        Open a campaign before creating a manufacturing batch.
                    </p>
                    <NavLink
                        href="/manufacturing"
                        type="button"
                        className="mt-3 inline-flex"
                    >
                        View campaigns
                    </NavLink>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-lg bg-most-secondary p-6 shadow-md"
                noValidate
            >
                <div className='flex flex-col gap-3'>
                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <CustomInput
                            type="number"
                            min="1"
                            placeholder="Number of batches"
                            label="Number of batches"
                            name="numberOfBatches"
                            value={numberOfBatches}
                            onChange={(event) => {
                                setNumberOfBatches(event.target.value);
                                setFormError('');
                            }}
                            onBlur={() => {
                                setTouched((current) => ({
                                    ...current,
                                    numberOfBatches: true,
                                }));
                                setErrors(validateForm());
                            }}
                            required
                            err={touched.numberOfBatches ? errors.numberOfBatches || '' : ''}
                        />

                        <CustomInput
                            type="text"
                            placeholder="Campaign name"
                            label="Campaign"
                            name="campaign"
                            value={activeCampaign?.name || ''}
                            err={touched.campaign ? errors.campaign || '' : ''}
                            readOnly
                            className="capitalize"
                            info={activeCampaign ? `Status: ${activeCampaign.status}` : ''}
                        />

                        <CustomInput
                            type="text"
                            placeholder="Generated batch ID"
                            label="Batch ID"
                            name="batchId"
                            value={batchId}
                            readOnly
                        />

                        <CustomInput
                            type="date"
                            name="batchDate"
                            value={batchDate}
                            onChange={(event) => {
                                setBatchDate(event.target.value);
                                setFormError('');
                            }}
                            onBlur={() => {
                                setTouched((current) => ({ ...current, batchDate: true }));
                                setErrors(validateForm());
                            }}
                            required
                            placeholder="Batch date"
                            label="Date"
                            err={touched.batchDate ? errors.batchDate || '' : ''}
                        />

                        <div className="relative">
                            <WarehouseSelect
                                value={warehouseId}
                                onChange={(value) => {
                                    setWarehouseId(value || '');
                                    setTouched((current) => ({
                                        ...current,
                                        warehouseId: true,
                                    }));
                                    setFormError('');
                                }}
                                label="Source warehouse"
                                placeholder={
                                    loadingWarehouses
                                        ? 'Loading warehouses…'
                                        : 'Select source warehouse'
                                }
                                required
                                disabled={loadingWarehouses || Boolean(warehousesError)}
                                options={warehouseOptions}
                                error={touched.warehouseId ? errors.warehouseId : ""}
                            />
                            {/* {touched.warehouseId && errors.warehouseId && (
                            <p className="absolute mt-1 text-sm text-error">
                                {errors.warehouseId}
                            </p>
                        )} */}
                            {warehousesError && (
                                <p className="absolute mt-1 text-sm text-error">
                                    Failed to load warehouses
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 p-3 border-1 rounded-lg border-color-200">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Raw materials</h2>
                            {loadingMaterials && (
                                <span className="text-sm text-white-500">
                                    Loading materials…
                                </span>
                            )}
                        </div>

                        {materialsError && (
                            <p className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-error">
                                {materialsError}
                            </p>
                        )}

                        {materials.map((row, index) => (
                            <MaterialRow
                                key={row.rowId}
                                index={index}
                                row={row}
                                options={materialOptions}
                                optionsVersion={optionsVersion}
                                error={errors.materials?.[index]}
                                touched={touched.materials?.[index]}
                                onMaterialChange={handleMaterialChange}
                                onWeightChange={handleWeightChange}
                                onBlur={handleMaterialBlur}
                                onAdd={addMaterial}
                                onRemove={removeMaterial}
                                canRemove={materials.length > 1}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-color-200 p-4 text-sm sm:grid-cols-3">
                        <div>
                            <span className="block text-white-500">Materials</span>
                            <span className="font-medium">{materials.length}</span>
                        </div>
                        <div>
                            <span className="block text-white-500">Weight per batch</span>
                            <span className="font-medium">
                                {totalWeightPerBatch.toFixed(3)} kg
                            </span>
                        </div>
                        <div>
                            <span className="block text-white-500">
                                Total planned raw material
                            </span>
                            <span className="font-medium">
                                {totalPlannedWeight.toFixed(3)} kg
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                loadingMaterials ||
                                loadingWarehouses ||
                                Boolean(materialsError) ||
                                Boolean(warehousesError) ||
                                !activeCampaign?._id
                            }
                            className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Save Batch'}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={saving}
                            className="rounded-lg border border-color-100 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Reset
                        </button>

                        {formError && <p className="text-sm text-error">{formError}</p>}
                    </div></div>
            </form>
        </div>
        // </Manufacturing>
    );
}
