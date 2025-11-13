'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '@/lib/axiosInstance'
import SelectInput from '@/Components/inputs/SelectInput';
import CustomInput from '@/Components/inputs/CustomInput';
import RoleSelect from '../component/RoleSelect';
import CheckBox from '@/Components/inputs/CheckBox';
import { Toast } from '@/Components/toast';
import NewPermission from '../component/NewPermission';
import DeleteButton from '@/Components/buttons/DeleteButton';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { useHighlight } from '@/hook/useHighlight';
import { useUser } from '@/context/UserContext';
import useAuthz from '@/hook/useAuthz';
import Loading from '@/Components/Loading';

export default function RolePermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [allPerms, setAllPerms] = useState([]); // [{key,label,roles:[]}, ...]
  const [assigned, setAssigned] = useState(new Set()); // Set<key>
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [openNew, setOpenNew] = useState(false);
  const { refreshPermissionsNow } = useUser();
  const [rolesRead, setRolesRead] = useState(false);
  const [read, setRead] = useState(false);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [deletePer, setDeletePer] = useState(false);
  const contentRef = useHighlight(q);
  const { can } = useAuthz();

  useEffect(() => {
    // setLoading(true);
    if (can('roles:read')) setRolesRead(true);
    if (can('users:permissions:create')) setCreate(true);
    if (can('users:permissions:update')) setUpdate(true);
    if (can('users:permissions:read')) setRead(true);
    if (can('users:permissions:delete')) setDeletePer(true);
    setLoading(false);
  }, [can]);

  // Initial load: roles + permissions list
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.all([
          axiosInstance.get('/api/permissions/roles'),
          axiosInstance.get('/api/permissions'), // all permissions
        ]);
        // console.log('rolesRes', rolesRes, rolesRes.data?.roles);
        // console.log('permsRes', permsRes, permsRes.data?.permissions);

        if (!rolesRes?.data?.status) throw new Error('Failed to load roles');
        if (!permsRes?.data?.status) throw new Error('Failed to load permissions');

        setRoles(rolesRes.data?.roles || []);
        setAllPerms(permsRes.data?.permissions || []);

        // default select first non-owner role (to avoid bypass confusion)
        const firstRole = (rolesRes.data?.roles || []).find(r => r !== 'owner') || (rolesRes.data?.roles || [])[0] || '';
        // console.log('firstRole', firstRole);
        if (firstRole) setSelectedRole(firstRole);
      } catch (e) {
        setError(e.message || 'Failed to load');
        Toast.error(`Load error: ${e.message}`, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When role changes, load its assigned keys
  useEffect(() => {
    if (!selectedRole) return;
    (async () => {
      try {
        setLoading(true);
        const roleRes = await axiosInstance.get(
          `/api/permissions/role/${encodeURIComponent(selectedRole)}`
        );
        const keys = roleRes.data?.permissions || [];
        setAssigned(new Set(keys));
      } catch (e) {
        setError(e.message || 'Failed to load role permissions');
        Toast.error(`Role load error: ${e.message}`, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRole]);

  // Filter for search
  const filteredPerms = useMemo(() => {
    if (!q) return allPerms;
    const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    // console.log('r', r); // whatever r match with text i want to select them by green color 
    const filtered = allPerms.filter(p => r.test(p.key) || r.test(p.label || ''));
    return filtered;
  }, [q, allPerms]);

  // Group filtered permissions by module prefix (before first ":")
  const groupedPerms = useMemo(() => {
    const map = new Map(); // module -> array of perms
    for (const p of filteredPerms) {
      const key = typeof p?.key === 'string' ? p.key : '';
      const group = key.includes(':') ? key.split(':')[0] : 'other';
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(p);
    }
    // sort groups alphabetically and each group's items by key
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    entries.forEach(([, arr]) => arr.sort((x, y) => String(x.key).localeCompare(String(y.key))));
    return entries; // [ [group, perms[]], ... ]
  }, [filteredPerms]);

  const toggleKey = (key) => {
    setAssigned(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const setAllVisible = (checked) => {
    const keys = filteredPerms.map(p => p.key);
    setAssigned(prev => {
      const next = new Set(prev);
      if (checked) keys.forEach(k => next.add(k)); else keys.forEach(k => next.delete(k));
      return next;
    });
  };

  const save = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      const body = { role: selectedRole, keys: Array.from(assigned) };
      const res = await axiosInstance.post('/api/permissions/role/set', body);
      Toast.success('Permissions saved');
      // refresh assignment from server response to stay in sync
      // console.log('res', res, res.data?.assigned);
      const newKeys = res.data?.assigned || [];
      setAssigned(new Set(newKeys));

      // 🔥 Tell UserContext to reload permissions
      refreshPermissionsNow();
    } catch (e) {
      Toast.error(`Save failed: ${e.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = async (key) => {
    if (!key) return;
    const ok = await Toast.promise(`Delete permission \"${key}\"? This cannot be undone.`);
    if (!ok) return;
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/permissions/${encodeURIComponent(key)}`);
      // Remove from master list
      setAllPerms((prev) => prev.filter((p) => p.key !== key));
      // Also unassign from current role locally
      setAssigned((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      Toast.success('Permission deleted');
      refreshPermissionsNow();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Delete failed';
      Toast.error(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='flex flex-col gap-1 h-full'>
      <h1 className="text-xl font-semibold mb-4">Roles &amp; Permissions</h1>

      {error ? (
        <div className="mb-3 rounded-md bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      ) : null}

      {loading && (
        <div className="space-y-4 flex flex-col gap-4 h-full">
          <Loading variant="skeleton" className="h-[100px]" />
          <Loading variant="skeleton" className="flex-1" />
        </div>
      )}
      {!loading && <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4 bg-white-100/50 px-3 py-2 rounded-lg">
        <div className="flex-1">
          {rolesRead &&
            <RoleSelect
              value={selectedRole}
              onChange={(e) => setSelectedRole(e?.target?.value)}
              label="Role"
              placeholder="Pick or create a role…"
            />
          }
        </div>
        <div className="flex-1">
          <CustomInput
            type='text'
            name="search"
            label={"Search permissions"}
            placeholder="items:read, inventory:issue, ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {update && <>
            <button
              className="btn-secondary mb-5"
              onClick={() => setAllVisible(true)}
              disabled={loading}
              type="button"
            >Select all (visible)</button>
            <button
              className="btn-secondary mb-5"
              onClick={() => setAllVisible(false)}
              disabled={loading}
              type="button"
            >Clear (visible)</button>
            <SubmitButton
              label="Save"
              type="button"
              onClick={save}
              loading={loading}
              disabled={saving || loading || !selectedRole}
            />
          </>
          }
          {
            create &&
            <NewPermission
              open={openNew}
              setOpen={setOpenNew}
              selectedRole={selectedRole}
              onCreated={async (created) => {
                // Merge the new permission into the list if not present
                setAllPerms((prev) => {
                  const exists = prev.some(p => p.key === created?.key);
                  const next = exists ? prev : [...prev, created];
                  return next.sort((a, b) => String(a.key).localeCompare(String(b.key)));
                });
                // Refresh assigned for the current role (in case we checked "assign now")
                if (selectedRole) {
                  try {
                    const roleRes = await axiosInstance.get(`/api/permissions/role/${encodeURIComponent(selectedRole)}`);
                    const keys = roleRes.data?.permissions || [];
                    setAssigned(new Set(keys));
                  } catch (err) {
                    // non-fatal; user can still see new key in list
                  }
                }
              }}
            />
          }
        </div>
      </div>}

      {(selectedRole && read && !loading) && <div ref={contentRef} className="w-full bg-white-100/0 rounded-lg p-0 flex-1 ">
        <div className="w-full flex max-w-full overflow-y-auto overflow-x-hidden gap-4 p-2 flex-wrap">
          {groupedPerms.map(([group, perms]) => {
            const groupKeys = perms.map(p => p.key);
            const selectedCount = groupKeys.filter(k => assigned.has(k)).length;
            const allSelected = selectedCount === groupKeys.length && groupKeys.length > 0;
            const someSelected = selectedCount > 0 && !allSelected;

            const toggleGroup = (check) => {
              setAssigned(prev => {
                const next = new Set(prev);
                groupKeys.forEach(k => check ? next.add(k) : next.delete(k));
                return next;
              });
            };

            return (
              <div key={group}
                className="min-w-fit flex-1 rounded-lg overflow-clip outline-0 p-1 transition-all duration-300
                hover:outline-4 outline-white-100 backdrop-blur-2xl
                shadow-md hover:shadow-green-200  hover:shadow-2xl dark:hover:shadow-green-500/30
                bg-black-300 hover:bg-black-200">
                <div className="w-auto max-w-full px-2 py-2 bg-white-50 font-semibold uppercase tracking-wide text-xs text-white-400 flex items-center justify-between">
                  <span className='flex-2 flex gap-2'>
                    <span>{group}</span>
                    <span className="text-white-500">({selectedCount}/{groupKeys.length})</span>
                  </span>
                  <div className="flex-0 flex gap-2">
                    <button className="btn-secondary py-1 px-2 text-nowrap w-full cursor-pointer" type="button" onClick={() => toggleGroup(true)}>Select All</button>
                    <button className="btn-secondary py-1 px-2 text-nowrap w-full cursor-pointer" type="button" onClick={() => toggleGroup(false)}>Clear</button>
                  </div>
                </div>
                <div className='flex gap-2 flex-3 max-w-full flex-wrap'>
                  {perms.map((p) => {
                    const checked = assigned.has(p.key);
                    return (
                      <div key={p.key} className="max-w-full flex-1 flex items-center gap-2 p-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <CheckBox
                            name={p.key}
                            value={p.key}
                            checked={checked}
                            onChange={() => toggleKey(p.key)}
                            parent_className='m-0'
                            className='cursor-pointer rounded-inherit'
                            readOnly={!update}
                          />
                          {/* <div className="flex flex-col truncate">
                            <div className="font-mono text-sm truncate">{p.key}</div>
                            {p.label ? <div className="text-xs text-gray-600 mt-0.5 truncate">{p.label}</div> : null}
                          </div> */}
                        </div>
                        {deletePer && <DeleteButton
                          onClick={() => deletePermission(p.key)}
                          label="Delete Permission"
                        />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {groupedPerms.length === 0 && (
            <div className="p-4 text-sm text-white-500">No permissions match your search.</div>
          )}
        </div>
      </div>}
      {
        (!selectedRole && !loading) &&
        <div className="bg-white-100/30 rounded-lg w-full flex items-center justify-center flex-1 gap-2 p-4">
          <span className='capitalize text-white-400'>please select a role</span>
        </div>
      }
    </div>
  );
}
