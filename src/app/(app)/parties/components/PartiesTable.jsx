'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import Table from '@/Components/layout/Table';

export default function PartiesTable({ rows = [], loading = false, emptyMessage = 'No parties found.' }) {
  const router = useRouter();

  const columns = useMemo(() => {
    return [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => (
          <button
            type="button"
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push(`/parties/${row._id}`)}
          >
            {row.name || row.legalName || '-'}
          </button>
        ),
      },
      {
        key: 'roles',
        header: 'Roles',
        sortable: false,
        className: 'capitalize',
        render: (row) => {
          const roles = Array.isArray(row.roles) ? row.roles : [];
          return roles.length ? roles.map((r) => String(r).toLowerCase()).join(', ') : '-';
        },
      },
      {
        key: 'taxId',
        header: 'Tax ID',
        sortable: false,
        render: (row) => row?.taxProfile?.taxId || '-',
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (row) => row.email || '-',
      },
      {
        key: 'phone',
        header: 'Phone',
        sortable: true,
        render: (row) => row.phone || '-',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        className: 'capitalize',
        render: (row) => row.status || '-',
      },
      {
        key: 'action',
        header: 'Action',
        sortable: false,
        align: 'right',
        render: (row) => (
          <button
            type="button"
            className="text-secondary-text/80 underline cursor-pointer"
            onClick={() => router.push(`/parties/${row._id}/edit`)}
          >
            Edit
          </button>
        ),
      },
    ];
  }, [router]);

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={(r) => r._id}
      selectable="none"
      sortable={true}
      loading={loading}
      emptyMessage={emptyMessage}
      pageSize={10}
    />
  );
}
