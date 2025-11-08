'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '@/Components/toast';
import Table from '@/Components/layout/Table';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import RoleSelect from '../components/RoleSelect';


export default function ManageUsersPage() {
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState({ key: 'name', direction: 'asc' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/users');
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.users)
        ? res.data.users
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setRows(list);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load users';
      setError(msg);
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    const str = (v) => (v == null ? '' : String(v)).toLowerCase();
    return rows.filter((r) => {
      return [
        r.name,
        r.email,
        r.role,
        r?.company?.name,
        r?.status
      ]
        .map(str)
        .join(' ')
        .includes(needle);
    });
  }, [rows, q]);

  const handleRoleChange = async (userId, nextRole) => {
    if (!nextRole) return;
    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (String(r._id) === String(userId) ? { ...r, role: nextRole } : r)),
    );
    try {
      await axiosInstance.patch(`/api/users/${userId}/role`, { role: nextRole });
      Toast.success('Role updated');
    } catch (e) {
      // revert
      setRows((prev) => prev); // no-op, user will refresh anyway; optionally refetch:
      Toast.error(e?.response?.data?.message || 'Failed to update role');
      fetchUsers();
    }
  };

  const handleRemove = async (userId) => {
    const ok = await Toast.promise('Remove this user from your company? This cannot be undone.');
    console.log('ok', ok);
    if (!ok) return;
    try {
      await axiosInstance.post(`/api/users/${userId}/remove`);
      Toast.success('User removed');
      setRows((prev) => prev.filter((r) => String(r._id) !== String(userId)));
      setSel((prev) => prev.filter((k) => String(k) !== String(userId)));
    } catch (e) {
      Toast.error(e?.response?.data?.message || 'Failed to remove user');
    }
  };
  console.log('rows', rows);
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-lg font-semibold">Manage Users</div>
        <div className="flex items-center gap-2">
          <CustomInput
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / role"
            parent_className="mb-0"
            className="min-w-[260px]"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4">Loading…</div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <Table
          columns={[
            {
              key: 'name',
              header: 'Name',
              sortable: true,
              render: (r) => (
                <div className="flex flex-col">
                  <div className="font-medium">{r.fullName ||r.name || '—'}</div>
                  <div className="text-xs text-white-500">{r.email}</div>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              sortable: true,
              render: (r) => (
                <RoleSelect
                  className="border rounded-lg px-2 py-1 text-sm w-fit"
                  value={r.role || 'viewer'}
                  onChange={(e) => handleRoleChange(r._id, e.target.value)}
                  name="role"
                />
              ),
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (r) => (
                <span className="px-2 py-0.5 rounded text-xs bg-white-100">
                  {r.status || 'active'}
                </span>
              ),
              align: 'center',
            },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="btn-danger px-2 py-1"
                    onClick={() => handleRemove(r._id)}
                    title="Remove user"
                  >
                    Remove
                  </button>
                </div>
              ),
              align: 'right',
            },
          ]}
          data={filtered}
          rowKey={(r) => String(r._id)}
          selectable="multiple"
          selectedKeys={sel}
          onSelectionChange={setSel}
          sortable
          sortBy={sortBy}
          onSortChange={setSortBy}
          loading={loading}
          emptyMessage="No users"
          pageSize={10}
        />
      )}
    </div>
  );
}
