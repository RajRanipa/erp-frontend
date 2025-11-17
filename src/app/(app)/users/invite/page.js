// src/app/(app)/users/page.js
'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import InviteForm from '../components/InviteForm';
import PendingInvites from '../components/PendingInvites';

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
    try {
      setLoading(true);
      await axiosInstance.post(`/api/users/invite/${id}/resend`);
      Toast.info('Invite re-sent');
    } catch (e) {
      Toast.error(e?.response?.data?.message || 'Failed to re-send invite');
      return;
    }finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/api/users/invite/${id}/revoke`);
      Toast.warning('Invite revoked');
      setInvites((prev) => prev.filter(i => i._id !== id));
    } catch (e) {
      Toast.error(e?.response?.data?.message || 'Failed to revoke invite');
    }finally {
      setLoading(false);
    }
  };

  console.log("invites", invites);
  return (
    <div>
      {canInvite && <InviteForm onInvited={handleInvited} />}
        <div className="space-y-6 mt-5">
          {canInvite ? (
            <PendingInvites
              rows={invites}
              loading={loading}
              onResend={handleResend}
              onRevoke={handleRevoke}
              // onRemove={handleRemove}
            />
          ) : (
            <div className="text-white-500">You don’t have permission to invite users.</div>
          )}
        </div>
    </div>
  );
}