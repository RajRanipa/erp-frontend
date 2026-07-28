'use client';

import { use } from 'react';
import DocumentDetail from '../../components/DocumentDetail';

export default function GoodsReceiptDetailPage({ params }) {
  const { id } = use(params);
  return <DocumentDetail kind="receipts" id={id} />;
}
