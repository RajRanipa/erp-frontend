// src/app/inventory/page.js (or any route)
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';

const InventoryPage = () => {
  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <p>All your product stock will show here.</p>
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;