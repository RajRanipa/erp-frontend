'use client';

import { useEffect, useMemo, useState } from 'react';
import Loading from '@/Components/Loading';
import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';
import { useWarehouses } from '@/hooks/useWarehouses';
import { cn } from '@/utils/cn';
import MovementForm from '../components/MovementForm';
import PackingChangeForm from '../components/PackingChangeForm';
import TransferForm from '../components/TransferForm';

const TAB_DEFINITIONS = [
  { id: 'RECEIPT', label: 'Receipt', hint: 'Add stock', permission: 'inventory:receipt' },
  { id: 'ISSUE', label: 'Issue', hint: 'Reduce stock', permission: 'inventory:issue' },
  { id: 'ADJUST', label: 'Adjust', permission: 'inventory:adjust' },
  { id: 'RESERVE_RELEASE', label: 'Reserve / Release', permission: 'inventory:reserve' },
  { id: 'TRANSFER', label: 'Transfer', permission: 'inventory:transfer' },
  { id: 'REPACK', label: 'Re-packing', permission: 'inventory:repack' },
];

const EmptyWarehouse = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
    <div className="text-secondary-text">Create an active warehouse before posting inventory.</div>
    <NavLink href="/warehouses" type="button">Manage warehouses</NavLink>
  </div>
);

export default function AddInventory() {
  const { can } = useAuthz();
  const { loading, list: warehouses } = useWarehouses();
  const availableTabs = useMemo(
    () => TAB_DEFINITIONS.filter(tab => can(tab.permission)),
    [can],
  );
  const [activeTab, setActiveTab] = useState('');
  const [reserveMode, setReserveMode] = useState('RESERVE');

  useEffect(() => {
    if (!availableTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || '');
    }
  }, [activeTab, availableTabs]);

  const hasWarehouse = warehouses.length > 0;
  const defaultWarehouseId = hasWarehouse ? String(warehouses[0]._id) : '';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex flex-wrap gap-2 z-1 relative top-[1px] h-fit">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-t-lg border border-b-1 rounded-b-none px-3.5 py-1.5 font-medium capitalize cursor-pointer border-color-200 text-primary-text',
              activeTab === tab.id
                ? 'border-b-most text-secondary-text'
                : 'border-b-white border-transparent',
            )}
            type="button"
          >
            {tab.label} {tab.hint && <span className="text-xs text-white-500">{tab.hint}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-fit p-1 gap-6 border border-t rounded-b-lg border-color-200 z-0 relative mb-2">
        {loading && <Loading variant="skeleton" className="h-full" />}
        {!loading && !hasWarehouse && <EmptyWarehouse />}
        {!loading && hasWarehouse && !availableTabs.length && (
          <div className="h-full flex items-center justify-center text-secondary-text">
            You do not have permission to post inventory movements.
          </div>
        )}

        {!loading && hasWarehouse && (
          <>
            {['RECEIPT', 'ISSUE', 'ADJUST'].includes(activeTab) && (
              <MovementForm
                mode={activeTab}
                defaultWarehouseId={defaultWarehouseId}
                warehouses={warehouses}
              />
            )}

            {activeTab === 'RESERVE_RELEASE' && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 p-3 pb-0">
                  {['RESERVE', 'RELEASE'].map(mode => (
                    <button
                      key={mode}
                      className={cn(
                        'px-3 py-1 rounded font-medium',
                        reserveMode === mode
                          ? 'bg-primary text-white'
                          : 'bg-white border border-color-200 text-primary-text',
                      )}
                      onClick={() => setReserveMode(mode)}
                      type="button"
                    >
                      {mode === 'RESERVE' ? 'Reserve' : 'Release'}
                    </button>
                  ))}
                </div>
                <MovementForm
                  mode={reserveMode}
                  defaultWarehouseId={defaultWarehouseId}
                  warehouses={warehouses}
                />
              </div>
            )}

            {activeTab === 'TRANSFER' && (
              <TransferForm warehouses={warehouses} />
            )}
            {activeTab === 'REPACK' && (
              <PackingChangeForm warehouses={warehouses} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
