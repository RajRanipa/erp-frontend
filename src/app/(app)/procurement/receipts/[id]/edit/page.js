'use client';

import { use } from 'react';
import GoodsReceiptForm from '../../../components/GoodsReceiptForm';

export default function EditGoodsReceiptPage({ params }) {
  const { id } = use(params);
  return <GoodsReceiptForm receiptId={id} />;
}
