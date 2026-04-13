

'use client';

import React, { useCallback } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { addIcon } from '@/utils/SVG';
import AddButton from '@/Components/buttons/AddButton';

// Contact persons for a Party.
// Parent owns state: contacts[]
// Each contact shape:
// {
//   name, designation, phone, email, isPrimary
// }

function emptyContact() {
  return {
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false,
  };
}

export default function PartyContacts({
  value = [],
  onChange,
  title = 'Contacts',
  disabled = false,
}) {
  const contacts = Array.isArray(value) ? value : [];

  const setAt = useCallback(
    (idx, patch) => {
      if (!onChange) return;
      const next = contacts.map((c, i) => (i === idx ? { ...(c || {}), ...(patch || {}) } : c));
      onChange(next);
    },
    [contacts, onChange]
  );

  const addContact = useCallback(() => {
    if (!onChange) return;
    onChange([...(contacts || []), emptyContact()]);
  }, [contacts, onChange]);

  const removeContact = useCallback(
    (idx) => {
      if (!onChange) return;
      onChange(contacts.filter((_, i) => i !== idx));
    },
    [contacts, onChange]
  );

  const setPrimary = useCallback(
    (idx) => {
      if (!onChange) return;
      const next = contacts.map((c, i) => ({ ...(c || {}), isPrimary: i === idx }));
      onChange(next);
    },
    [contacts, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-secondary-text/70">Add contact persons. Mark one primary contact.</p>
        </div>
        <AddButton title="Add contact" onClick={addContact} size="sm" disabled={disabled} />
      </div>

      {contacts.length === 0 ? (
        <div className="text-sm text-secondary-text/70">No contacts added.</div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, idx) => {
            const c = contact || {};
            return (
              <div key={idx} className="border border-white-100 rounded-lg p-3 bg-white-100/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium">Contact #{idx + 1}</div>
                  <button
                    type="button"
                    className="text-xs text-red-400 underline"
                    onClick={() => removeContact(idx)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <CustomInput
                    label="Name"
                    value={c.name || ''}
                    onChange={(e) => setAt(idx, { name: e.target.value })}
                    placeholder="Person name"
                    disabled={disabled}
                  />

                  <CustomInput
                    label="Designation"
                    value={c.designation || ''}
                    onChange={(e) => setAt(idx, { designation: e.target.value })}
                    placeholder="Owner / Manager"
                    disabled={disabled}
                  />

                  <CustomInput
                    label="Phone"
                    value={c.phone || ''}
                    onChange={(e) => setAt(idx, { phone: e.target.value })}
                    placeholder="+91..."
                    disabled={disabled}
                  />

                  <CustomInput
                    label="Email"
                    value={c.email || ''}
                    onChange={(e) => setAt(idx, { email: e.target.value })}
                    placeholder="name@example.com"
                    disabled={disabled}
                  />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="radio"
                    name={`primaryContact_${title}`}
                    checked={!!c.isPrimary}
                    onChange={() => setPrimary(idx)}
                    disabled={disabled}
                  />
                  <span className="text-sm">Primary Contact</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}