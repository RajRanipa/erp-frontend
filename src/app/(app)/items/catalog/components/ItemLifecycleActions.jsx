'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/Components/toast';
import SubmitButton from '@/Components/buttons/SubmitButton';
import useAuthz from '@/hooks/useAuthz';
import {
  apiErrorMessage,
  apiMessage,
  itemMasterApi,
} from '../itemMasterApi';

const transitions = {
  draft: [
    { to: 'in_review', label: 'Submit for review' },
    { to: 'archived', label: 'Archive' },
  ],
  in_review: [
    { to: 'approved', label: 'Approve' },
    { to: 'returned', label: 'Return' },
    { to: 'archived', label: 'Archive' },
  ],
  returned: [
    { to: 'in_review', label: 'Resubmit' },
    { to: 'archived', label: 'Archive' },
  ],
  approved: [
    { to: 'active', label: 'Activate' },
    { to: 'archived', label: 'Archive' },
  ],
  active: [
    { to: 'blocked', label: 'Block' },
    { to: 'archived', label: 'Archive' },
  ],
  blocked: [
    { to: 'active', label: 'Reactivate' },
    { to: 'archived', label: 'Archive' },
  ],
};

export default function ItemLifecycleActions({ item }) {
  const router = useRouter();
  const { can } = useAuthz();
  const [busy, setBusy] = useState('');
  const actions = transitions[item?.status] || [];

  const transition = async action => {
    setBusy(action.to);
    try {
      const response = await itemMasterApi.transition(item._id, action.to);
      Toast.success(apiMessage(response, `Item moved to ${action.to}`));
      router.refresh();
      window.location.reload();
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to change Item status'));
    } finally {
      setBusy('');
    }
  };

  if (!can('items:status:update') || !actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <SubmitButton
          key={action.to}
          type="button"
          label={action.label}
          loading={busy === action.to}
          disabled={Boolean(busy)}
          onClick={() => transition(action)}
        />
      ))}
    </div>
  );
}
