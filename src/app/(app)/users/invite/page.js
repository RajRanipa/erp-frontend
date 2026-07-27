'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import InviteForm from '../components/InviteForm';
import PendingInvites from '../components/PendingInvites';

export default function UserInvitationsPage() {
  const { can, isOwner } = useAuthz();
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [invites, setInvites] = useState([]);
  const canRead = isOwner || can('users:invite:read');
  const canInvite = isOwner || can('users:invite:create');

  const fetchInvites = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users/invite', {
        params: { status: 'pending', limit: 100 },
      });
      setInvites(response?.data?.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const runAction = async (id, action) => {
    setActionId(id);
    try {
      await axiosInstance.post(`/api/users/invite/${id}/${action}`);
      Toast.success(action === 'resend' ? 'Invitation resent.' : 'Invitation revoked.');
      await fetchInvites();
    } catch (error) {
      Toast.error(error?.response?.data?.message || `Failed to ${action} invitation.`);
    } finally {
      setActionId('');
    }
  };

  if (!canRead && !canInvite) {
    return (
      <div className="rounded-xl border border-white-100 bg-white-50 p-8 text-center text-white-500">
        You do not have permission to manage invitations.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canInvite && <InviteForm onInvited={() => fetchInvites()} />}
      {canRead && (
        <section className="rounded-xl mt-4">
          <div className="mb-4">
            <h2 className="font-semibold">Pending invitations</h2>
            <p className="text-sm text-white-500">Links expire automatically after seven days.</p>
          </div>
          <PendingInvites
            rows={invites}
            loading={loading}
            actionId={actionId}
            canResend={isOwner || can('users:invite:resend')}
            canRevoke={isOwner || can('users:invite:revoke')}
            onResend={(id) => runAction(id, 'resend')}
            onRevoke={(id) => runAction(id, 'revoke')}
          />
        </section>
      )}
    </div>
  );
}
