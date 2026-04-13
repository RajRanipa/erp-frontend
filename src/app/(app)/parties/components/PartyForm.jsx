'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';

import PartyRolesPicker from './PartyRolesPicker';
import PartyTaxProfile from './PartyTaxProfile';
import PartyAddresses from './PartyAddresses';
import PartyContacts from './PartyContacts';
import PartyPaymentTerms from './PartyPaymentTerms';
import { Toast } from '@/Components/toast';

import { defaultPartyForm, validatePartyForm } from '../lib/partySchema';
import { formToApiPartyPayload } from '../lib/partyMappers';
import { PARTY_STATUS_OPTIONS } from '../lib/partyConstants';

function stableKey(obj) {
    try {
        return JSON.stringify(obj || {});
    } catch {
        return String(Date.now());
    }
}

const STEPS = [
    { key: 'basic', label: 'Basic' },
    { key: 'roles', label: 'Roles' },
    { key: 'tax', label: 'Tax' },
    { key: 'addresses', label: 'Addresses' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'payment', label: 'Payment' },
    { key: 'notes', label: 'Notes' },
    { key: 'review', label: 'Review' },
];

function pickStepErrors(stepKey, errors) {
    const e = errors || {};
    const out = {};
    const keys = Object.keys(e);

    const matchers = {
        basic: (k) => ['name', 'legalName', 'status', 'phone', 'email', 'website'].includes(k) || k.startsWith('basic.'),
        roles: (k) => k === 'roles' || k.startsWith('roles.'),
        tax: (k) => k === 'taxProfile' || k.startsWith('taxProfile') || k.startsWith('tax.'),
        addresses: (k) => k === 'addresses' || k.startsWith('addresses'),
        contacts: (k) => k === 'contacts' || k.startsWith('contacts'),
        payment: (k) => k === 'paymentTerms' || k.startsWith('paymentTerms') || k === 'currency' || k === 'creditLimit',
        notes: (k) => k === 'notes' || k.startsWith('notes'),
        review: (_k) => false,
    };

    const isMatch = matchers[stepKey] || (() => false);
    keys.forEach((k) => {
        if (isMatch(k)) out[k] = e[k];
    });
    return out;
}

export default function PartyForm({
    initialValues,
    onSubmit,
    onCancel,
    disabled = false,
    mode = 'create', // 'create' | 'edit'
}) {
    const [form, setForm] = useState(() => defaultPartyForm(initialValues || {}));
    const [saving, setSaving] = useState(false);
    const submitLockRef = useRef(false);
    const [stepIndex, setStepIndex] = useState(0);
    const step = STEPS[stepIndex] || STEPS[0];

    const initKey = useMemo(() => stableKey(initialValues || {}), [initialValues]);

    useEffect(() => {
        // Only reset when initialValues meaningfully change
        setForm(defaultPartyForm(initialValues || {}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initKey]);

    const validation = useMemo(() => validatePartyForm(form), [form]);
    const errors = validation.errors || {};
    const canSubmit = validation.ok;
    const stepErrors = useMemo(() => pickStepErrors(step.key, errors), [step.key, errors]);
    const canGoNext = Object.keys(stepErrors).length === 0;
    const isLastStep = step.key === 'review';
    const derivedCountry = useMemo(() => {
        const addr = form?.addresses;
        // New model: { primaryAddress, additionalAddresses }
        if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
            return addr?.primaryAddress?.country || 'India';
        }
        // Fallback (old model)
        const list = Array.isArray(addr) ? addr : [];
        const def = list[0];
        return def?.country || 'India';
    }, [form.addresses]);

    const set = (patch) => setForm((prev) => ({ ...prev, ...(patch || {}) }));

    // Prevent Enter from submitting the form when inside typing fields, but allow on buttons/links.
    const handleKeyDownCapture = (e) => {
        if (e.key !== 'Enter') return;

        const el = e.target;
        const tag = (el?.tagName || '').toLowerCase();

        // Allow Enter in textarea
        if (tag === 'textarea') return;

        // Only prevent Enter inside typing fields to avoid accidental form submit.
        // Let Enter work normally on buttons/links/etc. (so Back/Next can be triggered by keyboard).
        const isTypingField = tag === 'input' || tag === 'select';
        if (isTypingField) {
            e.preventDefault();
        }
    };

    const goNext = useCallback(() => {
        // Recompute validation on demand (it already updates via state), but use latest errors
        const v = validatePartyForm(form);
        const se = pickStepErrors(step.key, v.errors || {});
        if (Object.keys(se).length) {
            Toast.error('Please fix validation errors in this step');
            return;
        }
        setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, [form, step.key]);

    const goBack = useCallback(() => {
        setStepIndex((i) => Math.max(i - 1, 0));
    }, []);

    const handleSubmit = async (e) => {
        console.log("SUBMIT CALLED", Date.now(), new Error().stack)
        e?.preventDefault?.();

        // prevent any double-entry
        if (submitLockRef.current) return;

        // Safety: ONLY allow API submit from the real submit button on final step
        const submitter = e?.nativeEvent?.submitter;
        const submitterType = (submitter?.getAttribute?.('type') || '').toLowerCase();
        if (isLastStep && submitterType !== 'submit') return;

        if (!isLastStep) {
            goNext();
            return;
        }

        if (!canSubmit) {
            Toast.error('Please fix validation errors');
            return;
        }

        // 🔒 LOCK FIRST (this removes the race)
        submitLockRef.current = true;
        setSaving(true);

        try {
            const payload = formToApiPartyPayload(form);
            await onSubmit?.(payload);
            Toast.success(mode === 'edit' ? 'Party updated' : 'Party created');
        } catch (err) {
            Toast.error(err?.response?.data?.message || err?.message || 'Something went wrong');
        } finally {
            submitLockRef.current = false;
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={(e) => { console.log("SUBMIT CALLED", Date.now(), new Error().stack); handleSubmit(e); }}
            onKeyDownCapture={handleKeyDownCapture}
            className="space-y-6 flex flex-col gap-3 mt-3"
        >
            {/* Stepper */}
            <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm text-secondary-text/70">Step {stepIndex + 1} of {STEPS.length}</div>
                        <div className="text-lg font-semibold">{step.label}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        {STEPS.map((s, idx) => {
                            const active = idx === stepIndex;
                            const done = idx < stepIndex;
                            return (
                                <div
                                    key={s.key}
                                    className={`text-xs px-2 py-1 rounded border ${active ? 'border-action bg-white-200' : done ? 'border-white-200 bg-white-100' : 'border-white-200 bg-transparent'} ${active ? 'font-semibold' : ''}`}
                                >
                                    {idx + 1}. {s.label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step-level validation hints */}
                {Object.keys(stepErrors).length > 0 && (
                    <div className="mt-3 text-sm text-red-400">
                        {Object.entries(stepErrors).map(([k, msg]) => (
                            <div key={k}>• {msg}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Step content */}
            {step.key === 'basic' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <CustomInput
                            label="Name"
                            required
                            value={form.name}
                            onChange={(e) => set({ name: e.target.value })}
                            disabled={disabled}
                            placeholder="Company / Person name"
                        />

                        <CustomInput
                            label="Legal Name"
                            value={form.legalName}
                            onChange={(e) => set({ legalName: e.target.value })}
                            disabled={disabled}
                            placeholder="Registered name (optional)"
                        />

                        <SelectInput
                            label="Status"
                            value={form.status}
                            onChange={(e) => set({ status: e.target.value })}
                            options={PARTY_STATUS_OPTIONS}
                            disabled={disabled}
                        />

                        <CustomInput
                            label="Phone"
                            value={form.phone}
                            onChange={(e) => set({ phone: e.target.value })}
                            disabled={disabled}
                            placeholder="+91..."
                        />

                        <CustomInput
                            label="Email"
                            value={form.email}
                            onChange={(e) => set({ email: e.target.value })}
                            disabled={disabled}
                            placeholder="name@example.com"
                        />

                        <CustomInput
                            label="Website"
                            value={form.website}
                            onChange={(e) => set({ website: e.target.value })}
                            disabled={disabled}
                            placeholder="https://..."
                        />
                    </div>
                </div>
            )}

            {step.key === 'roles' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <PartyRolesPicker
                        value={form.roles}
                        onChange={(roles) => set({ roles })}
                        disabled={disabled}
                        required={true}
                    />
                </div>
            )}

            {step.key === 'tax' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <PartyTaxProfile
                        taxProfile={form.taxProfile}
                        onChange={(patch) =>
                            setForm((prev) => ({
                                ...prev,
                                taxProfile: {
                                    ...(prev?.taxProfile || {}),
                                    ...(patch || {}),
                                },
                            }))
                        }
                        disabled={disabled}
                        country={derivedCountry}
                    />
                </div>
            )}

            {step.key === 'addresses' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <PartyAddresses
                        value={form.addresses}
                        onChange={(addresses) => set({ addresses })}
                        disabled={disabled}
                    />
                </div>
            )}

            {step.key === 'contacts' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <PartyContacts
                        value={form.contacts}
                        onChange={(contacts) => set({ contacts })}
                        disabled={disabled}
                    />
                </div>
            )}

            {step.key === 'payment' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <PartyPaymentTerms
                        paymentTerms={form.paymentTerms}
                        currency={form.currency}
                        creditLimit={form.creditLimit}
                        onChange={(patch) => {
                            set({
                                paymentTerms: patch.paymentTerms,
                                currency: patch.currency,
                                creditLimit: patch.creditLimit,
                            });
                        }}
                        disabled={disabled}
                    />
                </div>
            )}

            {step.key === 'notes' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CustomInput
                            label="Notes"
                            value={form.notes}
                            onChange={(e) => set({ notes: e.target.value })}
                            disabled={disabled}
                            placeholder="Any extra notes"
                        />
                    </div>
                </div>
            )}

            {step.key === 'review' && (
                <div className="border border-white-100 rounded-lg p-3 bg-white-100/30 space-y-3">
                    <div className="text-sm text-secondary-text/70">Review your data before saving.</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded border border-white-100 p-3 bg-white-100/40">
                            <div className="font-semibold mb-2">Basic</div>
                            <div className="text-sm">Name: {form.name || '-'}</div>
                            <div className="text-sm">Legal Name: {form.legalName || '-'}</div>
                            <div className="text-sm">Status: {form.status || '-'}</div>
                            <div className="text-sm">Phone: {form.phone || '-'}</div>
                            <div className="text-sm">Email: {form.email || '-'}</div>
                            <div className="text-sm">Website: {form.website || '-'}</div>
                        </div>

                        <div className="rounded border border-white-100 p-3 bg-white-100/40">
                            <div className="font-semibold mb-2">Roles</div>
                            <div className="text-sm">{Array.isArray(form.roles) && form.roles.length ? form.roles.join(', ') : '-'}</div>
                        </div>

                        <div className="rounded border border-white-100 p-3 bg-white-100/40">
                            <div className="font-semibold mb-2">Tax</div>
                            <div className="text-sm">Tax Registered: {form?.taxProfile?.isTaxRegistered ? 'Yes' : 'No'}</div>
                            <div className="text-sm">Tax ID/GSTIN: {form?.taxProfile?.taxId || '-'}</div>
                            <div className="text-sm">PAN: {form?.taxProfile?.pan || '-'}</div>
                            <div className="text-sm">Place of Supply: {form?.taxProfile?.placeOfSupply || '-'}</div>
                        </div>

                        <div className="rounded border border-white-100 p-3 bg-white-100/40">
                            <div className="font-semibold mb-2">Addresses</div>
                            <div className="text-sm">Primary: {form?.addresses?.primaryAddress?.line1 || '-'}</div>
                            <div className="text-sm">City/State: {form?.addresses?.primaryAddress?.city || '-'} / {form?.addresses?.primaryAddress?.state || '-'}</div>
                            <div className="text-sm">Pincode: {form?.addresses?.primaryAddress?.pincode || '-'}</div>
                            <div className="text-sm">Additional: {Array.isArray(form?.addresses?.additionalAddresses) ? form.addresses.additionalAddresses.length : 0}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancel}
                        disabled={disabled || saving}
                    >
                        Cancel
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goBack();
                        }}
                        disabled={disabled || saving || stepIndex === 0}
                    >
                        Back
                    </button>

                    {!isLastStep ? (
                        <button
                            type="button"
                            data-action="next"
                            className="btn-primary"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                goNext();
                            }}
                            disabled={disabled || saving || !canGoNext}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={disabled || saving || !canSubmit}
                        >
                            {saving ? 'Saving…' : mode === 'edit' ? 'Update Party' : 'Create Party'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}