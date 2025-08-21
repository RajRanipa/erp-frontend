// src/app/dashboard/page.js
'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/toast';
import DisplayMain from '@/components/layout/DisplayMain';

const InventoryPage = () => {
  const toast = useToast();
  return (
    <DashboardLayout>
    <DisplayMain>
      <div>
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <p>All your product stock will show here.</p>
        <button
          onClick={() =>
            toast({
              type: "success",
              message: "Auto dismiss success!",
              duration: 4000,
              autoClose: true,
              placement: "top-right",
              animation: "right-left",
            })
          }
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-6"
        >
          Test Toast
        </button>
      </div>
      </DisplayMain>
    </DashboardLayout>
  );
};

export default InventoryPage;