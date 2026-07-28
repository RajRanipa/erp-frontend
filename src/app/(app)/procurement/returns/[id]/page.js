'use client';

import { use } from 'react';
import DocumentDetail from '../../components/DocumentDetail';

export default function PurchaseReturnDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail kind="returns" id={id} />;
}
