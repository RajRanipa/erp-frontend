// src/app/(app)/users/page.js
'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hook/useAuthz';
import InviteForm from './components/InviteForm';
import PendingInvites from './components/PendingInvites';

export default function UsersPage() {
  const { can } = useAuthz();
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);

  const canInvite = can('users:invite') || can('users:manage') || can('company:manage');

  const fetchInvites = useCallback(async () => {
    // you can expose a GET /api/users/invite?status=pending or reuse /api/users/invite list route
    // If you haven't created a list endpoint yet, temporarily store invites client-side after actions.
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/users/invite?status=pending'); // implement this list on backend or adjust path
      setInvites(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      // optional: silently ignore if list route not implemented
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const handleInvited = (created) => {
    Toast.success('Invite sent');
    setInvites((prev) => [created, ...prev]); // optimistic (or re-fetch)
    // fetchInvites();
  };

  const handleResend = async (id) => {
    await axiosInstance.post(`/api/users/invite/${id}/resend`);
    Toast.info('Invite re-sent');
  };

  const handleRevoke = async (id) => {
    await axiosInstance.post(`/api/users/invite/${id}/revoke`);
    Toast.warning('Invite revoked');
    setInvites((prev) => prev.filter(i => i._id !== id));
  };

  const handleRemove = async (id) => {
    await axiosInstance.delete(`/api/users/${id}`);
    Toast.warning('User removed');
    // If your table mixes invites & users, you may not have this id in `invites`.
    // Optionally re-fetch both invites and members; for now, just refresh invites list.
    fetchInvites();
  };

  console.log("invites", invites);
  return (
    <div>
      {canInvite && <InviteForm onInvited={handleInvited} />}
        <div className="space-y-6">
          {canInvite ? (
            <PendingInvites
              rows={invites}
              loading={loading}
              onResend={handleResend}
              onRevoke={handleRevoke}
              onRemove={handleRemove}
            />
          ) : (
            <div className="text-white-500">You don’t have permission to invite users.</div>
          )}
        </div>
    </div>
  );
}