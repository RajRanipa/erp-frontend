'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Table from '@/Components/layout/Table';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import RoleSelect from '@/Components/role/RoleSelect';
import Dialog from '@/Components/Dialog';
import SubmitButton from '@/Components/buttons/SubmitButton';
import useAuthz from '@/hooks/useAuthz';
import { useUser } from '@/context/UserContext';

const statusOptions = [
  { value: 'active', label: 'Active members' },
  { value: 'suspended', label: 'Suspended members' },
  { value: 'disabled', label: 'Disabled members' },
];

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
}

export default function ManageUsersPage() {
  const { can, isOwner } = useAuthz();
  const currentUser = useUser();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1, limit: 25 });
  const [roleDialog, setRoleDialog] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => setPage(1), [debouncedQ, status]);

  const loadRoles = useCallback(async () => {
    if (!can('roles:read') && !can('users:update:role')) return;
    const response = await axiosInstance.get('/api/permissions/roles');
    setRoles(response?.data?.roles || []);
  }, [can]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users', {
        params: {
          page,
          limit: 25,
          q: debouncedQ || undefined,
          status: status || undefined,
          sortBy: 'name',
          sortDir: 'asc',
        },
      });
      setRows(response?.data?.data || []);
      setMeta(response?.data?.meta || { total: 0, pages: 1, page: 1, limit: 25 });
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, page, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    loadRoles().catch((error) => {
      Toast.error(error?.response?.data?.message || 'Failed to load roles.');
    });
  }, [loadRoles]);

  const openRoleDialog = (member) => {
    setRoleDialog(member);
    setSelectedRoleId(String(member.roleId || ''));
  };

  const saveRole = async () => {
    if (!roleDialog || !selectedRoleId || selectedRoleId === String(roleDialog.roleId)) {
      setRoleDialog(null);
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/users/${roleDialog._id}/role`, { roleId: selectedRoleId });
      Toast.success('Member role updated.');
      setRoleDialog(null);
      await fetchUsers();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to update role.');
    } finally {
      setSaving(false);
    }
  };

  const changeMembershipStatus = useCallback(async (member, nextStatus) => {
    const action = nextStatus === 'active' ? 'restore' : 'suspend';
    const confirmed = await Toast.promise(
      `${action === 'restore' ? 'Restore' : 'Suspend'} ${member.fullName}?`,
      {
        title: `${action === 'restore' ? 'Restore' : 'Suspend'} member`,
        confirmLabel: action === 'restore' ? 'Restore' : 'Suspend',
        cancelLabel: 'Cancel',
      },
    );
    if (!confirmed) return;
    try {
      if (nextStatus === 'active') {
        await axiosInstance.post(`/api/users/${member._id}/restore`);
      } else {
        await axiosInstance.delete(`/api/users/${member._id}`);
      }
      Toast.success(`Member ${nextStatus === 'active' ? 'restored' : 'suspended'}.`);
      await fetchUsers();
    } catch (error) {
      Toast.error(error?.response?.data?.message || `Failed to ${action} member.`);
    }
  }, [fetchUsers]);

  const columns = useMemo(() => [
    {
      key: 'fullName',
      header: 'Member',
      render: (member) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-most-text">{member.fullName}</div>
          <div className="text-xs text-white-500">{member.email}</div>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: 'Role',
      render: (member) => (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
            {member.roleName}
          </span>
          {member.isOwner && <span title="Protected owner role">◆</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Membership',
      render: (member) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          member.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          {member.status}
        </span>
      ),
    },
    {
      key: 'lastSeenAt',
      header: 'Last active',
      render: (member) => <span className="text-sm text-white-500">{formatDate(member.lastSeenAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (member) => {
        const isSelf = String(member._id) === String(currentUser.userId);
        const canEditRole = !isSelf
          && (isOwner || can('users:update:role'))
          && (!member.isOwner || isOwner);
        const canSuspend = !isSelf
          && (isOwner || can('users:remove'))
          && (!member.isOwner || isOwner);
        return (
          <div className="flex justify-end gap-2">
            {canEditRole && member.status === 'active' && (
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openRoleDialog(member)}>
                Change role
              </button>
            )}
            {member.status === 'active' && canSuspend && (
              <button type="button" className="btn-danger px-3 py-1.5" onClick={() => changeMembershipStatus(member, 'suspended')}>
                Suspend
              </button>
            )}
            {member.status !== 'active' && (isOwner || can('users:restore')) && (
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => changeMembershipStatus(member, 'active')}>
                Restore
              </button>
            )}
          </div>
        );
      },
    },
  ], [can, changeMembershipStatus, currentUser.userId, isOwner]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-b from-white-200 to-transparent p-4">
          <div className="text-xs uppercase tracking-wide text-white-500">Matching members</div>
          <div className="mt-1 text-2xl font-semibold">{meta.total}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-b from-white-200 to-transparent p-4">
          <div className="text-xs uppercase tracking-wide text-white-500">Company roles</div>
          <div className="mt-1 text-2xl font-semibold">{roles.length}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-b from-white-200 to-transparent p-4">
          <div className="text-xs uppercase tracking-wide text-white-500">Security model</div>
          <div className="mt-1 text-sm font-medium text-emerald-400">Company-scoped RBAC</div>
        </div>
      </section>

      <section
        aria-label="Member filters"
        className="flex flex-col gap-3 rounded-xl border border-white-100 bg-white-50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <CustomInput
          label="Search members"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Name, email, or role"
          parent_className="mb-0 min-w-0 sm:min-w-64 sm:flex-[1_1_16rem]"
        />
        <SelectInput
          label="Membership status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={statusOptions}
          parent_className="mb-0 sm:w-52 sm:flex-none"
        />
        <button
          type="button"
          className="btn-secondary mb-0 w-full px-4 py-2 sm:w-auto sm:flex-none"
          onClick={fetchUsers}
          disabled={loading}
        >
          Refresh
        </button>
      </section>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table
          columns={columns}
          data={rows}
          rowKey={(member) => String(member._id)}
          loading={loading}
          emptyMessage="No members match these filters."
          pagination={false}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-white-500">
        <span>Page {meta.page || page} of {Math.max(meta.pages || 1, 1)}</span>
        <div className="flex gap-2">
          <button className="btn-secondary px-3 py-1.5" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
            Previous
          </button>
          <button className="btn-secondary px-3 py-1.5" disabled={page >= (meta.pages || 1) || loading} onClick={() => setPage((value) => value + 1)}>
            Next
          </button>
        </div>
      </div>

      <Dialog
        open={Boolean(roleDialog)}
        onClose={() => setRoleDialog(null)}
        title="Change member role"
        size="sm"
        side="center"
        actions={(
          <>
            <button type="button" className="btn" onClick={() => setRoleDialog(null)}>Cancel</button>
            <SubmitButton type="button" onClick={saveRole} loading={saving}>Save role</SubmitButton>
          </>
        )}
      >
        <div className="p-2">
          <p className="mb-4 text-sm text-white-500">
            Changing {roleDialog?.fullName}&apos;s role revokes their company sessions.
          </p>
          <RoleSelect
            label="New role"
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            roles={roles}
            excludeOwner={!isOwner}
            maxRank={isOwner ? undefined : currentUser.roleRank}
            required
          />
        </div>
      </Dialog>
    </div>
  );
}
