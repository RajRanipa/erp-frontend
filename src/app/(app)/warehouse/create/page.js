// src/app/warehouse/create/page.js
'use client';

import DisplayMain from '@/components/layout/DisplayMain';
import WarehouseForm from '../components/warehouseForm';
import Warehouse from '../page';

export default function CreateWarehousePage() {
  return (
    <Warehouse>
      <h1 className="text-2xl font-semibold mb-6">Create Warehouse</h1>
      <WarehouseForm />
    </Warehouse>
  );
}