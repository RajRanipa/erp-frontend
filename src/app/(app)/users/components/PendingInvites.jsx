// src/app/(app)/users/components/PendingInvites.jsx
'use client';
import React, { useMemo } from 'react';
import Table from '@/Components/layout/Table';
import SubmitButton from '@/Components/buttons/SubmitButton';

function formatDateTime(v) {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
}

function actionButtons(row, { onResend, onRevoke }, loading) {
  const status = row?.status;
  if (!status) return '—';

  try {
    if (status === 'pending') {
      return (
        <div className="flex gap-2 justify-end">
          {/* <button
            type="button"
            className="px-2 py-1 bg-yellow-600 text-white rounded"
            onClick={() => onResend?.(row._id)}
            title="Resend invite"
          >
            Resend
          </button> */}
          <SubmitButton
            type="button"
            onClick={() => onResend?.(row._id)}
            title="Resend invite"
            loading={loading}
          >
            Resend
          </SubmitButton>
          <SubmitButton
            type="button"
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={() => onRevoke?.(row._id)}
            title="Revoke invite"
          >
            Revoke
          </SubmitButton>
        </div>
      );
    }

    return '—';
  } catch {
    return '—';
  }
}



export default function PendingInvites({ rows = [], loading = false, onResend, onRevoke, pageSize = 10 }) {
  const columns = useMemo(() => ([
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (r) => r.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (r) => (r.role?.toUpperCase?.() || r.role || '—'),
      // className: 'text-center',
    },
    {
      key: 'companyName',
      header: 'Company',
      sortable: true,
      render: (r) => r.companyName || r.company?.name || '—',
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      sortable: true,
      render: (r) => formatDateTime(r.expiresAt),
      className: 'whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => r.status,
      className: 'whitespace-nowrap',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => actionButtons(r, { onResend, onRevoke }, loading),
    },
  ]), [onResend, onRevoke]);

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={(r) => r._id}
      loading={loading}
      emptyMessage="No pending invites."
      pageSize={pageSize}
    />
  );
}