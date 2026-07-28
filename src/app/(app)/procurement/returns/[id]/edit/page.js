'use client';

import { use } from 'react';
import PurchaseReturnForm from '../../../components/PurchaseReturnForm';

export default function EditPurchaseReturnPage({ params }) {
  const { id } = use(params);
  return <PurchaseReturnForm returnId={id} />;
}
