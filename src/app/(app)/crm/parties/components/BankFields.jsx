

'use client';
import React, { memo, useCallback, useMemo, useState } from 'react';
import CustomInput from '@/components/inputs/CustomInput';
import RadioButton from '@/components/inputs/RadioButton';
import SelectInput from '@/components/inputs/SelectInput';
import SelectTypeInput from '@/components/inputs/SelectTypeInput';
import TextArea from '@/components/inputs/TextArea';
import { useToast } from '@/components/toast';
import FormHolder from '@/components/inputs/FormHolder';

/**
 * BankFields
 * Controlled editor for Party.bank
 *
 * Props:
 *  - value: {
 *      holderName, bankName, accountNo, ifsc, branch,
 *      accountType, notes
 *    }
 *  - onChange: (next) => void
 */

const valOf = (e) => (e && e.target !== undefined
  ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value)
  : e);

// const maskAccount = (v = '') => (v ? v.replace(/.(?=.{4})/g, '•') : '');// only for 4 digit showing
const maskAccount = (v = '') => (v ? v.replace(/./g, '•') : '');
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/; // RBI format: 4 letters + 0 + 6 alnum

const BankCard = memo(function BankCard({ data, onField, onValidateIfsc }) {
  const [reveal, setReveal] = useState(false);

  return (
    <>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3">
        <CustomInput
          name="bank.holderName"
          label={"Account holder name"}
          placeholder="Adani Enterprises Limited"
          value={data.holderName || ''}
          onChange={(e) => onField('holderName', valOf(e))}
          required
        />
        <CustomInput
          name="bank.bankName"
          label={"Bank name"}
          placeholder="HDFC Bank"
          value={data.bankName || ''}
          onChange={(e) => onField('bankName', valOf(e))}
        />

        <div className="flex items-center gap-2">
          <CustomInput
            name="bank.accountNo"
            label={"Account number"}
            placeholder="XXXXXXXX1234"
            type={reveal ? 'number' : 'password'}
            value={data.accountNo || ''}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
              onField('accountNo', onlyDigits);
            }}
            required
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
            onBtnClick={() => setReveal((r) => !r)}
            btnContent={reveal ? '🙈' : '👁️'}
          />
        </div>

        <div className="flex items-center gap-2">
          <CustomInput
            name="bank.ifsc"
            label={"IFSC code"}
            placeholder="HDFC0001234"
            value={(data.ifsc || '').toUpperCase()}
            onChange={(e) => onField('ifsc', valOf(e).toUpperCase())}
            maxLength={11}
            required
            onBtnClick={onValidateIfsc}
            btnContent={'Validate'}
          />
        </div>

        <CustomInput
          name="bank.branch"
          label={"Branch"}
          placeholder="Ahmedabad"
          value={data.branch || ''}
          onChange={(e) => onField('branch', valOf(e))}
        />

        <div className="flex items-center gap-4">
          <RadioButton
            label="Account type"
            name="bank.accountType"
            options={[
              { label: 'Current', value: 'current' },
              { label: 'Savings', value: 'savings' },
            ]}
            value={data.accountType || 'current'}
            onChange={(e) => onField('accountType', e?.target?.value ?? 'current')}
            required
          />
        </div>
      </div>

      <TextArea
        name="bank.notes"
        placeholder="Notes (optional)"
        value={data.notes || ''}
        onChange={(e) => onField('notes', valOf(e))}
      />
    </>
  );
});

export default function BankFields({ value = {}, onChange }) {
  const toast = useToast();
  const data = useMemo(() => ({
    holderName: '', bankName: '', accountNo: '', ifsc: '', branch: '',
    accountType: 'current', notes: '',
    ...value,
  }), [value]);

  const set = useCallback((patch) => {
    onChange?.({ ...data, ...patch });
  }, [onChange, data]);

  const onField = useCallback((key, val) => set({ [key]: val }), [set]);

  const onValidateIfsc = useCallback(() => {
    const ifsc = (data.ifsc || '').toUpperCase();
    if (!IFSC_RE.test(ifsc)) {
      toast({ type: 'error', message: 'Invalid IFSC format. Example: HDFC0001234' });
      return;
    }
    toast({ type: 'success', message: 'IFSC format looks valid' });
  }, [data.ifsc, toast]);

  return (

    <FormHolder title={'Bank (Vendors)'}>
      <BankCard data={data} onField={onField} onValidateIfsc={onValidateIfsc} />
    </FormHolder>

  );
}