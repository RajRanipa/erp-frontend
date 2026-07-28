'use client';

import { use } from 'react';
import DocumentDetail from '../../components/DocumentDetail';

export default function PurchaseInvoiceDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail kind="invoices" id={id} />;
}
