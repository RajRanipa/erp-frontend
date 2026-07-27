'use client';

import React, { useCallback } from 'react';
import AddButton from '@/Components/buttons/AddButton';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CURRENT', label: 'Current' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CASH_CREDIT', label: 'Cash Credit' },
  { value: 'OTHER', label: 'Other' },
];

function emptyBankAccount() {
  return {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
    branch: '',
    accountType: 'CURRENT',
    currency: 'INR',
    isPrimary: false,
    isActive: true,
    verifiedAt: null,
  };
}

export default function PartyBankAccounts({
  value = [],
  onChange,
  disabled = false,
}) {
  const accounts = Array.isArray(value) ? value : [];
  const setAt = useCallback((index, patch) => {
    onChange?.(
      accounts.map((account, current) => (
        current === index ? { ...account, ...patch } : account
      )),
    );
  }, [accounts, onChange]);

  const setPrimary = useCallback(index => {
    onChange?.(
      accounts.map((account, current) => ({
        ...account,
        isPrimary: current === index,
      })),
    );
  }, [accounts, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Bank Accounts</h3>
          <p className="text-xs text-secondary-text/70">
            Store payment instructions. Verification is intentionally handled separately.
          </p>
        </div>
        <AddButton
          title="Add bank account"
          size="sm"
          disabled={disabled}
          onClick={() => onChange?.([...accounts, emptyBankAccount()])}
        />
      </div>

      {!accounts.length ? (
        <div className="text-sm text-secondary-text/70">No bank accounts added.</div>
      ) : (
        accounts.map((account, index) => (
          <div key={account._id || index} className="border border-white-100 rounded-lg p-3 bg-white-100/40">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium">Account #{index + 1}</div>
              <button
                type="button"
                className="text-xs text-red-400 underline"
                disabled={disabled}
                onClick={() => onChange?.(accounts.filter((_, current) => current !== index))}
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <CustomInput
                label="Account Holder"
                value={account.accountHolderName || ''}
                onChange={(e) => setAt(index, { accountHolderName: e.target.value })}
                disabled={disabled}
              />
              <CustomInput
                label="Bank Name"
                value={account.bankName || ''}
                onChange={(e) => setAt(index, { bankName: e.target.value })}
                disabled={disabled}
              />
              <CustomInput
                label="Account Number"
                value={account.accountNumber || ''}
                onChange={(e) => setAt(index, { accountNumber: e.target.value })}
                disabled={disabled}
                autoComplete="off"
              />
              <CustomInput
                label="IFSC Code"
                value={account.ifscCode || ''}
                onChange={(e) => setAt(index, { ifscCode: e.target.value.toUpperCase() })}
                disabled={disabled}
              />
              <CustomInput
                label="SWIFT Code"
                value={account.swiftCode || ''}
                onChange={(e) => setAt(index, { swiftCode: e.target.value.toUpperCase() })}
                disabled={disabled}
              />
              <CustomInput
                label="Branch"
                value={account.branch || ''}
                onChange={(e) => setAt(index, { branch: e.target.value })}
                disabled={disabled}
              />
              <SelectInput
                label="Account Type"
                value={account.accountType || 'CURRENT'}
                options={ACCOUNT_TYPE_OPTIONS}
                onChange={(e) => setAt(index, { accountType: e.target.value })}
                disabled={disabled}
              />
              <CustomInput
                label="Currency"
                value={account.currency || 'INR'}
                onChange={(e) => setAt(index, { currency: e.target.value.toUpperCase() })}
                disabled={disabled}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="primaryPartnerBankAccount"
                  checked={Boolean(account.isPrimary)}
                  onChange={() => setPrimary(index)}
                  disabled={disabled}
                />
                Primary Account
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={account.isActive !== false}
                  onChange={(e) => setAt(index, { isActive: e.target.checked })}
                  disabled={disabled}
                />
                Active
              </label>
              <span className="text-xs text-secondary-text/70">
                {account.verifiedAt ? 'Verified' : 'Not verified'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
