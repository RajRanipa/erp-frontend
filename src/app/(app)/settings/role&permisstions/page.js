'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance';
import CustomInput from '@/Components/inputs/CustomInput';
import CheckBox from '@/Components/inputs/CheckBox';
import Dialog from '@/Components/Dialog';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import { useUser } from '@/context/UserContext';

const emptyRole = { name: '', key: '', description: '', rank: 20 };

export default function RolePermissionsPage() {
  const { can, isOwner } = useAuthz();
  const currentUser = useUser();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [assigned, setAssigned] = useState(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState(emptyRole);
  const { markPermissionsForRefresh } = useUser();

  const canRead = isOwner || (can('roles:read') && can('permissions:read'));
  const canCreate = isOwner || can('roles:create');
  const canUpdate = isOwner || can('roles:permissions:update');
  const canDelete = isOwner || can('roles:delete');

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const [roleResponse, permissionResponse] = await Promise.all([
        axiosInstance.get('/api/permissions/roles'),
        axiosInstance.get('/api/permissions'),
      ]);
      const nextRoles = roleResponse?.data?.roles || [];
      setRoles(nextRoles);
      setPermissions(permissionResponse?.data?.permissions || []);
      setSelectedId((current) => (
        nextRoles.some((role) => String(role.id) === String(current))
          ? current
          : String(nextRoles.find((role) => !role.isOwner)?.id || nextRoles[0]?.id || '')
      ));
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to load roles and permissions.');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(selectedId)) || null,
    [roles, selectedId],
  );

  useEffect(() => {
    setAssigned(new Set(selectedRole?.permissions || []));
  }, [selectedRole]);

  const groupedPermissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const groups = new Map();
    permissions
      .filter((permission) => !normalizedQuery
        || `${permission.key} ${permission.label}`.toLowerCase().includes(normalizedQuery))
      .forEach((permission) => {
        if (!groups.has(permission.module)) groups.set(permission.module, []);
        groups.get(permission.module).push(permission);
      });
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [permissions, query]);

  const togglePermission = (key) => {
    if (!canUpdate || selectedRole?.isOwner) return;
    setAssigned((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (keys, checked) => {
    if (!canUpdate || selectedRole?.isOwner) return;
    setAssigned((current) => {
      const next = new Set(current);
      keys.forEach((key) => (checked ? next.add(key) : next.delete(key)));
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole || selectedRole.isOwner) return;
    setSaving(true);
    try {
      const response = await axiosInstance.put(
        `/api/permissions/roles/${selectedRole.id}/permissions`,
        { permissions: [...assigned] },
      );
      const updatedRole = response?.data?.role;
      setRoles((current) => current.map((role) => (
        String(role.id) === String(updatedRole.id) ? updatedRole : role
      )));
      markPermissionsForRefresh();
      Toast.success('Role permissions updated.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/permissions/roles', {
        ...newRole,
        rank: Number(newRole.rank),
        permissions: [],
      });
      const created = response?.data?.data;
      setRoles((current) => [...current, created].sort((a, b) => b.rank - a.rank));
      setSelectedId(String(created.id));
      setCreateOpen(false);
      setNewRole(emptyRole);
      Toast.success('Custom role created.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to create role.');
    } finally {
      setSaving(false);
    }
  };

  const archiveRole = async () => {
    if (!selectedRole || selectedRole.isSystem) return;
    const confirmed = await Toast.promise(`Archive the ${selectedRole.name} role?`, {
      title: 'Archive role',
      confirmLabel: 'Archive',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/api/permissions/roles/${selectedRole.id}`);
      Toast.success('Role archived.');
      await load();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to archive role.');
    }
  };

  if (!canRead) {
    return (
      <div className="rounded-xl border border-white-100 bg-white-50 p-8 text-center text-white-500">
        You do not have permission to manage company roles.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Company roles &amp; permissions</h1>
          <p className="text-sm text-white-500">
            Permission definitions are protected by the application. Your company controls how they are assigned.
          </p>
        </div>
        {canCreate && (
          <button type="button" className="btn-secondary px-4 py-2" onClick={() => setCreateOpen(true)}>
            New custom role
          </button>
        )}
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="min-h-0 overflow-auto rounded-xl border border-white-100 bg-white-100 p-2">
          {loading ? <div className="p-4 text-white-500">Loading roles…</div> : roles.map((role) => (
            <button
              type="button"
              key={role.id}
              onClick={() => setSelectedId(String(role.id))}
              className={`mb-1 w-full rounded-lg border p-3 text-left transition ${String(selectedId) === String(role.id)
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-transparent hover:bg-white-100'
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-white-500">{role.memberCount} members</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-white-500">
                <span>Rank {role.rank}</span>
                {role.isSystem && <span>System</span>}
                {role.isOwner && <span className="text-amber-400">Protected</span>}
              </div>
            </button>
          ))}
        </aside>

        <section className="flex min-h-0 flex-col rounded-xl border border-white-100 bg-white-50 overflow-clip bg-white-100">
          {selectedRole ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white-100 p-4 bg-white-100">
                <div>
                  <h2 className="font-semibold">{selectedRole.name}</h2>
                  <p className="text-sm text-white-500">{selectedRole.description || 'No description provided.'}</p>
                </div>
                <div className="flex gap-2">
                  {canDelete && !selectedRole.isSystem && (
                    <button type="button" className="btn-danger px-3 py-1.5" onClick={archiveRole}>Archive role</button>
                  )}
                  {canUpdate && !selectedRole.isOwner && (
                    <SubmitButton type="button" loading={saving} onClick={savePermissions}>Save permissions</SubmitButton>
                  )}
                </div>
              </div>
              <div className="p-4">
                <CustomInput
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search permission name or key"
                  parent_className="mb-0"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4 pt-0">
                <div className="grid gap-3 xl:grid-cols-2">
                  {groupedPermissions.map(([module, items]) => {
                    const keys = items.map((permission) => permission.key);
                    const selectedCount = keys.filter((key) => assigned.has(key)).length;
                    return (
                      <div key={module} className="rounded-xl border border-white-100 bg-black-300 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <h3 className="font-medium capitalize">{module}</h3>
                            <p className="text-xs text-white-500">{selectedCount} of {items.length} enabled</p>
                          </div>
                          {canUpdate && !selectedRole.isOwner && (
                            <div className="flex gap-1">
                              <button className="btn-secondary px-2 py-1 text-xs" type="button" onClick={() => toggleGroup(keys, true)}>All</button>
                              <button className="btn-secondary px-2 py-1 text-xs" type="button" onClick={() => toggleGroup(keys, false)}>None</button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {items.map((permission) => (
                            <label key={permission.key} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-white-50">
                              <CheckBox
                                name={permission.key}
                                checked={selectedRole.isOwner || assigned.has(permission.key)}
                                onChange={() => togglePermission(permission.key)}
                                readOnly={!canUpdate || selectedRole.isOwner}
                                parent_className="m-0"
                                className="cursor-pointer rounded-inherit w-fit"
                                value={permission.key}
                                label={permission.label}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="m-auto text-white-500">Select a role to review its permissions.</div>
          )}
        </section>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create custom role"
        size="sm"
        side="center"
        actions={(
          <>
            <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <SubmitButton
              type="button"
              loading={saving}
              disabled={newRole.name.trim().length < 2}
              onClick={createRole}
            >
              Create role
            </SubmitButton>
          </>
        )}
      >
        <div className="space-y-2 p-2">
          <CustomInput
            label="Role name"
            value={newRole.name}
            onChange={(event) => setNewRole((value) => ({ ...value, name: event.target.value }))}
            placeholder="Example: Purchase Supervisor"
            required
          />
          <CustomInput
            label="Role key"
            value={newRole.key}
            onChange={(event) => setNewRole((value) => ({ ...value, key: event.target.value }))}
            placeholder="Generated from name if empty"
          />
          <CustomInput
            label="Description"
            value={newRole.description}
            onChange={(event) => setNewRole((value) => ({ ...value, description: event.target.value }))}
          />
          <CustomInput
            label="Authority rank"
            type="number"
            min="1"
            max={currentUser.isOwner ? 99 : Math.max(Number(currentUser.roleRank) - 1, 1)}
            value={newRole.rank}
            onChange={(event) => setNewRole((value) => ({ ...value, rank: event.target.value }))}
            info="Higher ranks can manage lower-ranked roles."
          />
        </div>
      </Dialog>
    </div>
  );
}
