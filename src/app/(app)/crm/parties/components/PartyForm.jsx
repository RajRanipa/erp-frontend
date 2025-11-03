// src/app/crm/parties/components/PartyForm.jsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaveParty } from '../hooks/useSaveParty';
import { useRouter } from 'next/navigation';
import { useToast, useConfirmToast } from '@/Components/toast';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import AddressInput from './AddressFields';
import ContactInput from './ContactFields';
import CreditInput from './CreditFields';
import BankInput from './BankFields';
import FormHolder from '@/Components/inputs/FormHolder';

const valOf = (e) => (e && e.target !== undefined ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e);

const empty = {
  legalName: 'orient ceramic fibertech llp', displayName: 'OCFL', role: 'vendor',
  email: 'rajranipa47@gmail.com', phone: '7474078616',
  tax: { gstin: '24AABCA2804L1Z0', pan: 'AABCA2804L' },
  addresses: [{ label: 'Billing', line1: '', city: '', state: '', pincode: '', isDefaultBilling: true }],
  contacts: [{ name: '', email: '', phone: '', isPrimary: true }],
  credit: { paymentTerm: 'NET30', creditLimit: 0, onHold: false },
  bank: { holderName: 'orient ceramic fibertech llp', ifsc: 'BKID0003100', accountNo: '1234123456789', branch: 'wankaner' },
  status: 'active',
};

export default function PartyForm({ initial, mode = 'create' }) {
  const [form, setForm] = useState(initial || empty);
  useEffect(() => { if (initial) setForm(initial); }, [initial]);
  
  const confirm = useConfirmToast();
  const { create, update } = useSaveParty();
  const router = useRouter();

  // Contacts section visibility with undo support
  const [showContacts, setShowContacts] = useState(false);
  const prevContactsRef = useRef((initial || empty).contacts);

  const openContacts = () => {
    if (showContacts) {
      // toggle off → restore snapshot and hide
      onChange('contacts', prevContactsRef.current || []);
      setShowContacts(false);
    } else {
      // toggle on → snapshot and show
      prevContactsRef.current = form.contacts;
      setShowContacts(true);
    }
  };
  const closeContacts = () => {
    // restore snapshot and hide section
    onChange('contacts', prevContactsRef.current || []);
    setShowContacts(false);
  };

  // Credit section visibility with undo support (only meaningful for customer/both)
  const [showCreditUI, setShowCreditUI] = useState(false);
  const prevCreditRef = useRef((initial || empty).credit);

  const openCredit = () => {
    if (showCreditUI) {
      // toggle off → restore snapshot and hide
      onChange('credit', prevCreditRef.current || { paymentTerm: 'NET30', creditLimit: 0, onHold: false });
      setShowCreditUI(false);
    } else {
      // toggle on → snapshot and show
      prevCreditRef.current = form.credit;
      setShowCreditUI(true);
    }
  };
  const closeCredit = () => {
    onChange('credit', prevCreditRef.current || { paymentTerm: 'NET30', creditLimit: 0, onHold: false });
    setShowCreditUI(false);
  };

  const showCredit = form.role === 'customer' || form.role === 'both';
  const showBank = form.role === 'vendor' || form.role === 'both';

  useEffect(() => {
    if (!showCredit) {
      setShowCreditUI(false);
    }
  }, [showCredit]);

  const onChange = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]] ?? (ref[keys[i]] = {});
      ref[keys.at(-1)] = value;
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.legalName?.trim()) e.legalName = 'Legal name is required';
    if (!['customer', 'vendor', 'both'].includes(form.role)) e.role = 'Select a role';
    if (form.tax?.gstin && form.tax.gstin.length !== 15) e.gstin = 'GSTIN must be 15 chars';
    if (form.tax?.pan && form.tax.pan.length !== 10) e.pan = 'PAN must be 10 chars';
    return e;
  };

  const submit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) {
      Toast.error( Object.values(errors)[0]);
      return;
    }
    const payload = {
      ...form,
      // strip role-incompatible sections (mirrors backend)
      ...(showCredit ? {} : { credit: undefined }),
      ...(showBank ? {} : { bank: undefined }),
    };
    try {
      console.log("payload :- ", payload);
      // return;
      if (mode === 'edit') {
        await update(form._id, payload);
        router.push(`/crm/parties/${form._id}`);
      } else {
        const created = await create(payload);
        console.log("created :- ", created);
        router.push(`/crm/parties/${created._id}`);
      }
    } catch (e) {
      // Toast already inside hook
    }
  };

  return (
    <div className="space-y-4">
      <FormHolder title={"Identity"}>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3">
          <CustomInput
            name="legalName"
            label={'Legal name'}
            placeholder="Adani Enterprises Limited"
            value={form.legalName}
            onChange={(e) => onChange('legalName', valOf(e))}
            required
          />
          <CustomInput
            name="displayName"
            label={"Display name"}
            placeholder="Adani Group"
            value={form.displayName || ''}
            onChange={(e) => onChange('displayName', valOf(e))}
          />

          <div className="col-span-3 grid grid-cols-3 gap-2">
            <SelectInput
              name="role"
              value={form.role}
              onChange={(e) => onChange('role', valOf(e))}
              options={[
                { label: 'Customer', value: 'customer' },
                { label: 'Vendor', value: 'vendor' },
                { label: 'Both', value: 'both' },
              ]}
              label="Role"
              placeholder="Role"
              required
            />
            <CustomInput
              name="email"
              type="email"
              label={'Email'}
              placeholder="support@adanione.com"
              value={form.email || ''}
              onChange={(e) => onChange('email', valOf(e))}
            />
            <CustomInput
              name="phone"
              placeholder="079 4754 5252"
              label={"Phone number"}
              value={form.phone || ''}
              onChange={(e) => onChange('phone', valOf(e))}
            />
          </div>
        </div>
      </FormHolder>

      <FormHolder title={"Tax"}>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3">
          <CustomInput
            name="tax.gstin"
            label={"GST No."}
            placeholder="24AABCA2804L1Z0"
            value={form.tax?.gstin || ''}
            onChange={(e) => onChange('tax.gstin', valOf(e)?.toUpperCase?.() || String(valOf(e) || '').toUpperCase())}
            required
          />
          <CustomInput
            name="tax.pan"
            label={"PAN No."}
            placeholder="AABCA2804L"
            value={form.tax?.pan || ''}
            onChange={(e) => onChange('tax.pan', (valOf(e) || '').toUpperCase())}
            required
          />
        </div>
      </FormHolder>

      {showBank && (<>
        <BankInput value={form.bank} onChange={(next) => onChange('bank', next)} />
      </>
      )}

      <AddressInput value={form.addresses} onChange={(next) => onChange('addresses', next)} />

      <FormHolder>
        <div className='flex gap-3'>
          {showCredit && (
            <button type="button" className={`btn ${showCreditUI ? "btn-primary" : "btn btn-secondary"}`} onClick={openCredit}>
              Add credit details
            </button>
          )}
          {
            <button type="button" className={`btn ${showContacts ? "btn-primary" : "btn btn-secondary"}`} onClick={openContacts}>
              Add contact detail
            </button>
          }
        </div>
      </FormHolder>
      
      {showCredit && (
        showCreditUI && (
          <CreditInput value={form.credit} onChange={(next) => onChange('credit', next)} onClose={closeCredit} />
        )
      )}
      
      {showContacts && (
        <div className="space-y-3">
          <ContactInput
            value={form.contacts}
            onChange={(next) => onChange('contacts', next)}
            onClose={closeContacts}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className="btn" onClick={async () => {
          const ok = await confirm({ title: 'Discard changes?', message: 'Your edits will be lost.' });
          if (ok) history.back();
        }}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{mode === 'edit' ? 'Save' : 'Create'}</button>
      </div>
    </div>
  );
}