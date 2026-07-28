'use client';

import { use } from 'react';
import PurchaseInvoiceForm from '../../../components/PurchaseInvoiceForm';

export default function EditPurchaseInvoicePage({ params }) {
  const { id } = use(params);
  return <PurchaseInvoiceForm invoiceId={id} />;
}
