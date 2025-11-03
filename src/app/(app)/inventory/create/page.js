'use client';

import React, { useReducer, useCallback, useMemo, useState } from 'react';
import Inventory from '../page';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hook/useAuthz';
import MovementForm from '../components/MovementForm';
import TransferForm from '../components/TransferForm';
import PackingChangeForm from '../components/PackingChangeForm';
import { cn } from '@/utils/cn';

export default function AddInventory() {
    const [activeTab, setActiveTab] = useState('RECEIPT'); // 'stock' | 'movements' | 'new'
    const { can } = useAuthz();
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
            <div className='w-full flex gap-2 z-1 relative top-[1px]'>
                <TabButton id="RECEIPT">Receipt</TabButton>
                <TabButton id="ISSUE">Issue</TabButton>
                <TabButton id="ADJUST">Adjust</TabButton>
                <TabButton id="TRANSFER">Transfer</TabButton>
                <TabButton id="REPACK">Re-packing</TabButton>
            </div>


            {/* {(can('inventory:receive') || can('inventory:issue') || can('inventory:adjust') || can('inventory:transfer')) && (
                <TabButton id="new">New Movement</TabButton>
            )} */}
            {activeTab && (
                <div className={cn(`p-1 gap-6 border border-t rounded-b-lg border-color-200 ${activeTab == 'RECEIPT' ? 'rounded-e-lg' : 'rounded-lg'} z-0 relative`)}>
                    {activeTab == 'RECEIPT' && can('inventory:receive') &&
                        <MovementForm mode="RECEIPT"
                            // onSuccess={() => Toast.info('Stock updated — refresh Stock tab to see changes.')}
                        />}
                    {activeTab == 'ISSUE' && can('inventory:issue') &&
                        <MovementForm
                            mode="ISSUE"
                            // onSuccess={() => Toast.info('Stock updated — refresh Stock tab to see changes.')}
                        />}
                    {activeTab == 'ADJUST' && can('inventory:adjust') &&
                        <MovementForm
                            mode="ADJUST"
                            // onSuccess={() => Toast.info('Stock updated — refresh Stock tab to see changes.')}
                        />}
                    {activeTab == 'TRANSFER' && can('inventory:transfer') &&
                        <TransferForm
                            // onSuccess={() => Toast.info('Stock updated — refresh Stock tab to see changes.')} 
                        />}
                    {activeTab == 'REPACK' && can('inventory:repack') &&
                        <PackingChangeForm
                            // onSuccess={() => Toast.info('Packing changed — stock updated.')} 
                        />}
                </div>
            )}
        </Inventory>
    );
}