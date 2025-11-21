'use client';
// frontend-erp/src/app/(app)/inventory/create/page.js
import React, { useReducer, useCallback, useMemo, useState, memo } from 'react';
import Inventory from '../page';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import MovementForm from '../components/MovementForm';
import TransferForm from '../components/TransferForm';
import PackingChangeForm from '../components/PackingChangeForm';
import { cn } from '@/utils/cn';
import Loading from '@/Components/Loading';
import NavLink from '@/Components/NavLink';
import { useWarehouses } from '@/hooks/useWarehouses';


const EmptyWarehouse = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="text-secondary-text">No warehouses found.</div>
        <NavLink href="/warehouse" type="button">Create warehouse</NavLink>
    </div>
);

export default function AddInventory() {
    const [activeTab, setActiveTab] = useState('RECEIPT'); // 'stock' | 'movements' | 'new'
    // Reserve/Release tab state
    const [reserveReleaseTab, setReserveReleaseTab] = useState('RESERVE'); // 'RESERVE' | 'RELEASE'
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
        <div className='w-full h-full flex flex-col'>
            <div className='w-full flex gap-2 z-1 relative top-[1px] h-fit'>
                {can('inventory:receipt') && <TabButton id="RECEIPT">Receipt <span className='text-xs text-white-500'>Add Stock</span></TabButton>}
                {can('inventory:issue') && <TabButton id="ISSUE">Issue <span className='text-xs text-white-500'>Reduce Stock</span></TabButton>}
                {can('inventory:adjust') && <TabButton id="ADJUST">Adjust</TabButton>}
                {can('inventory:reserve') && false && <TabButton id="RESERVE_RELEASE">Reserve/Release</TabButton>}
                {false && <TabButton id="TRANSFER">Transfer</TabButton>}
                {can('inventory:repack') && <TabButton id="REPACK">Re-packing</TabButton>}
            </div>

            <div className={cn(`flex-1 min-h-fit p-1 gap-6 border border-t rounded-b-lg border-color-200 ${activeTab === 'RECEIPT' ? 'rounded-e-lg' : 'rounded-lg'} z-0 relative mb-2`)}>
                {/* Parent decides the state for forms that need a warehouse */}
                {loading && <Loading variant="skeleton" className="h-full" />}

                {!loading && !hasWarehouse && <EmptyWarehouse />}

                {!loading && hasWarehouse && (
                    <>
                        {(activeTab === 'RECEIPT' || activeTab === 'ISSUE' || activeTab === 'ADJUST') &&
                            (can(`inventory:${activeTab.toLowerCase()}`)) && (
                                <MovementForm
                                    mode={activeTab}
                                    defaultWarehouseId={defaultWarehouseId}
                                    warehouses={warehouses}
                                />
                        )}

                        {activeTab === 'RESERVE_RELEASE' && can('inventory:reserve') && (
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        className={cn(
                                            "px-3 py-1 rounded font-medium",
                                            reserveReleaseTab === 'RESERVE'
                                                ? "bg-primary text-white"
                                                : "bg-white border border-color-200 text-primary-text"
                                        )}
                                        onClick={() => setReserveReleaseTab('RESERVE')}
                                        type="button"
                                    >Reserve</button>
                                    <button
                                        className={cn(
                                            "px-3 py-1 rounded font-medium",
                                            reserveReleaseTab === 'RELEASE'
                                                ? "bg-primary text-white"
                                                : "bg-white border border-color-200 text-primary-text"
                                        )}
                                        onClick={() => setReserveReleaseTab('RELEASE')}
                                        type="button"
                                    >Release</button>
                                </div>
                                <MovementForm
                                    mode={reserveReleaseTab}
                                    defaultWarehouseId={defaultWarehouseId}
                                    warehouses={warehouses}
                                />
                            </div>
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
        </div>
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