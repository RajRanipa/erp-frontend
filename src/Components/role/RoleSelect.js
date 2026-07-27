'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SelectInput from '@/Components/inputs/SelectInput';
import { axiosInstance } from '@/lib/axiosInstance';

export default function RoleSelect({
  value = '',
  onChange,
  label = '',
  placeholder = 'Select a role',
  disabled = false,
  parent_className = '',
  className = '',
  roles: suppliedRoles,
  excludeOwner = false,
  maxRank,
  required = false,
}) {
  const [roles, setRoles] = useState(Array.isArray(suppliedRoles) ? suppliedRoles : []);
  const [loading, setLoading] = useState(!Array.isArray(suppliedRoles));
  const [error, setError] = useState('');

  useEffect(() => {
    if (Array.isArray(suppliedRoles)) {
      setRoles(suppliedRoles);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    axiosInstance.get('/api/permissions/assignable-roles')
      .then((response) => {
        if (active) setRoles(response?.data?.roles || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || 'Roles could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [suppliedRoles]);

  const options = useMemo(() => roles
    .filter((role) => role.status !== 'archived')
    .filter((role) => !excludeOwner || !role.isOwner)
    .filter((role) => maxRank === undefined || Number(role.rank) < Number(maxRank))
    .map((role) => ({
      value: role.id || role._id,
      label: `${role.name}${role.isSystem ? '' : ' · Custom'}`,
    })), [excludeOwner, maxRank, roles]);

  return (
    <SelectInput
      label={label}
      name="roleId"
      placeholder={loading ? 'Loading roles…' : placeholder}
      value={value || ''}
      onChange={onChange}
      options={options}
      disabled={disabled || loading}
      parent_className={parent_className}
      className={className}
      required={required}
      err={error}
    />
  );
}
