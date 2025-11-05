'use client';
// frontend-erp/src/app/(app)/inventory/create/page.js
import React, { useReducer, useCallback, useMemo, useState, memo } from 'react';
import Inventory from '../page';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hook/useAuthz';
import MovementForm from '../components/MovementForm';
import TransferForm from '../components/TransferForm';
import PackingChangeForm from '../components/PackingChangeForm';
import { cn } from '@/utils/cn';
import Loading from '@/Components/Loading';
import NavLink from '@/Components/NavLink';
import { useWarehouses } from '@/hook/useWarehouses';


const EmptyWarehouse = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="text-secondary-text">No warehouses found.</div>
        <NavLink href="/warehouse" type="button">Create warehouse</NavLink>
    </div>
);

export default function AddInventory() {
    const [activeTab, setActiveTab] = useState('RECEIPT'); // 'stock' | 'movements' | 'new'
    const { can } = useAuthz();

    const { loading, list: warehouses } = useWarehouses(); // parent owns loading/empty/ready
    const hasWarehouse = warehouses.length > 0;
    const defaultWarehouseId = hasWarehouse ? String(warehouses[0]._id) : '';

    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={cn(`rounded-t-lg border border-b-1 border-b-most rounded-b-none px-3.5 py-1.5 font-medium capitalize cursor-pointer border-color-200 text-primary-text ${activeTab === id ? 'border-b-most text-secondary-text' : 'border-b-white border-transparent'}`)}
            type="button"
        >
            {children}
        </button>
    );
    return (
        <Inventory>
            <div className='w-full h-full flex flex-col'>
                <div className='w-full flex gap-2 z-1 relative top-[1px] h-fit'>
                    <TabButton id="RECEIPT">Receipt</TabButton>
                    <TabButton id="ISSUE">Issue</TabButton>
                    <TabButton id="ADJUST">Adjust</TabButton>
                    {false && <TabButton id="TRANSFER">Transfer</TabButton>}
                    <TabButton id="REPACK">Re-packing</TabButton>
                </div>

                <div className={cn(`h-full min-h-fit p-1 gap-6 border border-t rounded-b-lg border-color-200 ${activeTab === 'RECEIPT' ? 'rounded-e-lg' : 'rounded-lg'} z-0 relative mb-2`)}>
                    {/* Parent decides the state for forms that need a warehouse */}
                    {loading && <Loading variant="skeleton" className="h-full" />}

                    {!loading && !hasWarehouse && <EmptyWarehouse />}

                    {!loading && hasWarehouse && (
                        <>
                            {activeTab && can('inventory:receive') && (
                                <MovementForm
                                    mode={activeTab}
                                    defaultWarehouseId={defaultWarehouseId}
                                    warehouses={warehouses}
                                />
                            )}

                            {activeTab === 'TRANSFER' && can('inventory:transfer') && (
                                <TransferForm defaultWarehouseId={defaultWarehouseId} warehouses={warehouses} />
                            )}
                            {activeTab === 'REPACK' && can('inventory:repack') && (
                                <PackingChangeForm defaultWarehouseId={defaultWarehouseId} warehouses={warehouses} />
                            )}
                        </>
                    )}
                </div>
                {/* )} */}
            </div>
        </Inventory>
    );
}

{/* {activeTab === 'ISSUE' && can('inventory:issue') && (
                                <MovementForm
                                    mode="ISSUE"
                                    defaultWarehouseId={defaultWarehouseId}
                                    warehouses={warehouses}
                                />
                            )}
                            {activeTab === 'ADJUST' && can('inventory:adjust') && (
                                <MovementForm
                                    mode="ADJUST"
                                    defaultWarehouseId={defaultWarehouseId}
                                    warehouses={warehouses}
                                />
                            )} */}

                              {/* {(can('inventory:receive') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) && (
                <TabButton id="new">New Movement</TabButton>
            )} */}
            {/* {activeTab && ( */}