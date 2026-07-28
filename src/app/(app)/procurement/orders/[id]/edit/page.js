'use client';

import { use } from 'react';
import PurchaseOrderForm from '../../../components/PurchaseOrderForm';

export default function EditPurchaseOrderPage({ params }) {
  const { id } = use(params);
  return <PurchaseOrderForm orderId={id} />;
}
