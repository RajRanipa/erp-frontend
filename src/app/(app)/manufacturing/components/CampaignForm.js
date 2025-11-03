'use client';
import { useState, useEffect, useMemo } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import TextArea from '@/Components/inputs/TextArea';

const statusOptions = [
    { value: 'PLANNED', label: 'Planned' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'COMPLETED', label: 'Completed' },
];

function normalizeDate(d) {
    if (!d) return '';
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return '';
    // Convert to "YYYY-MM-DD" using LOCAL date, not UTC (fixes off-by-one in IST)
    const tzOffset = x.getTimezoneOffset(); // minutes
    const local = new Date(x.getTime() - tzOffset * 60 * 1000);
    return local.toISOString().slice(0, 10);
}

export default function CampaignForm({
    initialValues = { name: '', startDate: '', endDate: '', status: 'PLANNED', remarks: '' },
    mode = 'create',            // 'create' | 'edit'
    onSubmit,                   // async (values) => void
    submitting = false,
}) {
    console.log('initialValues ', initialValues)
    const [formData, setFormData] = useState({
        ...initialValues,
        startDate: normalizeDate(initialValues.startDate),
        endDate: normalizeDate(initialValues.endDate),
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [resetKey, setResetKey] = useState(0);

    const initKey = useMemo(() => [
        initialValues?.name ?? '',
        normalizeDate(initialValues?.startDate),
        normalizeDate(initialValues?.endDate),
        initialValues?.status ?? '',
        initialValues?.remarks ?? ''
    ].join('|'), [
        initialValues?.name,
        initialValues?.startDate,
        initialValues?.endDate,
        initialValues?.status,
        initialValues?.remarks
    ]);

    useEffect(() => {
        const next = {
            ...initialValues,
            startDate: normalizeDate(initialValues?.startDate),
            endDate: normalizeDate(initialValues?.endDate),
        };
        setFormData(prev => {
            const same =
                prev?.name === (next.name ?? '') &&
                prev?.startDate === (next.startDate ?? '') &&
                prev?.endDate === (next.endDate ?? '') &&
                prev?.status === (next.status ?? '') &&
                (prev?.remarks ?? '') === (next.remarks ?? '');
            return same ? prev : next;
        });
        // Reset UI state only when inputs actually changed
        setErrors({});
        setTouched({});
        setResetKey(k => k + 1);
    }, [initKey, initialValues]);

    const validate = (values) => {
        const e = {};
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const s = values.startDate ? new Date(values.startDate) : null;
        const ed = values.endDate ? new Date(values.endDate) : null;

        // requireds
        if (!values.name?.trim()) e.name = 'Name is required';
        if (!values.status) e.status = 'Status is required';
        if (!s) e.startDate = 'Start Date is required';

        const status = values.status; // proposed status in form

        const isCreate = mode === 'create';

        const isPast = (d) => d && d.setHours(0, 0, 0, 0) < today.getTime();
        const isFuture = (d) => d && d.setHours(0, 0, 0, 0) > today.getTime();

        // Rules by status & mode
        if (!e.startDate && s) {
            if (isCreate) {
                // Create always PLANNED in our policy
                if (isPast(s)) e.startDate = 'Start Date cannot be in the past';
            } else {
                // EDIT
                if (status === 'PLANNED') {
                    if (isPast(s)) e.startDate = 'Start Date cannot be in the past for PLANNED';
                }
                if (status === 'RUNNING') {
                    if (isFuture(s)) e.startDate = 'Running campaign cannot start in the future';
                }
                if (status === 'COMPLETED') {
                    if (isFuture(s)) e.startDate = 'Completed campaign cannot have a future start date';
                }
            }
        }

        // End date rules
        if (ed) {
            if (isNaN(ed.getTime())) e.endDate = 'End Date is invalid';
        }
        if (!e.endDate && s && ed) {
            if (ed < s) e.endDate = 'End Date cannot be before Start Date';
        }

        if (!e.endDate && ed) {
            if (status === 'PLANNED') {
                // allow future end
            }
            if (status === 'RUNNING') {
                // allow today/future end (planned completion)
            }
            if (status === 'COMPLETED') {
                if (isFuture(ed)) e.endDate = 'Completed campaign cannot have a future end date';
                if (!s) e.endDate = e.endDate || 'Start Date is required';
            }
        }

        return e;
    };

    const handleChange = (name, valueOrEvent) => {
        const value = valueOrEvent?.target !== undefined ? valueOrEvent.target.value : valueOrEvent;
        const next = { ...formData, [name]: value };
        setFormData(next);
        setErrors(validate(next));
    };
    const handleBlur = (name) => setTouched(prev => ({ ...prev, [name]: true }));

    const submit = async (e) => {
        e.preventDefault();
        const nextErrors = validate(formData);
        setErrors(nextErrors);
        setTouched({ name: true, startDate: true, endDate: true, status: true, remarks: !!formData.remarks });
        if (Object.keys(nextErrors).length) return;

        await onSubmit({
            name: formData.name.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            status: formData.status,
            remarks: formData.remarks || '',
        });
    };

    return (
        <form onSubmit={submit} className="bg-most-secondary shadow-md rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold mb-3">
                {mode === 'create' ? 'Campaign Details' : 'Edit Campaign'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput
                    key={`name-${resetKey}`}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(v) => handleChange('name', v)}
                    onBlur={() => handleBlur('name')}
                    required
                    placeholder="Campaign name"
                    label="Name"
                    err={touched.name ? errors.name : ''}
                />

                <SelectInput
                    key={`status-${resetKey}`}
                    name="status"
                    options={statusOptions}
                    value={formData.status}
                    onChange={(v) => handleChange('status', v)}
                    onBlur={() => handleBlur('status')}
                    required
                    placeholder="Status"
                    label="Status"
                    err={touched.status ? errors.status : ''}
                />

                <CustomInput
                    key={`startDate-${resetKey}`}
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(v) => handleChange('startDate', v)}
                    onBlur={() => handleBlur('startDate')}
                    required
                    placeholder="Start date"
                    label="Start Date"
                    err={touched.startDate ? errors.startDate : ''}
                />

                <CustomInput
                    key={`endDate-${resetKey}`}
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(v) => handleChange('endDate', v)}
                    onBlur={() => handleBlur('endDate')}
                    placeholder="End date (optional)"
                    label="End Date"
                    err={touched.endDate ? errors.endDate : ''}
                />

                {/* <CustomInput
                type="number"
                name="totalRawIssued"
                min="0"
                step="0.001"
                value={formData.totalRawIssued}
                onChange={(value) => handleChange('totalRawIssued', value)}
                placeholder="Total raw issued (kg)"
                label="Total Raw Issued (kg)"
              />

              <CustomInput
                type="number"
                name="totalFiberProduced"
                min="0"
                step="0.001"
                value={formData.totalFiberProduced}
                onChange={(value) => handleChange('totalFiberProduced', value)}
                placeholder="Total fiber produced (kg)"
                label="Total Fiber Produced (kg)"
              />

              <CustomInput
                type="number"
                name="meltReturns"
                min="0"
                step="0.001"
                value={formData.meltReturns}
                onChange={(value) => handleChange('meltReturns', value)}
                placeholder="Melt returns (kg)"
                label="Melt Returns (kg)"
              /> */}

                <div className="md:col-span-2">
                    <TextArea
                        key={`remarks-${resetKey}`}
                        name="remarks"
                        value={formData.remarks}
                        onChange={(v) => handleChange('remarks', v)}
                        placeholder="Optional notes"
                        rows={3}
                        label="Remarks"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting
                        ? (mode === 'create' ? 'Creating…' : 'Saving…')
                        : (mode === 'create' ? 'Create Campaign' : 'Save Changes')}
                </button>
            </div>
        </form>
    );
}