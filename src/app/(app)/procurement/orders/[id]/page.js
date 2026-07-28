'use client';

import { use } from 'react';
import DocumentDetail from '../../components/DocumentDetail';

export default function PurchaseOrderDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail kind="orders" id={id} />;
}
