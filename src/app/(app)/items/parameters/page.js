// src/app/items/create/page.js
'use client';
import React, { useEffect } from 'react';
import ItemForm from '../components/ItemForm'
import { Toast } from '@/Components/toast';

export default function Parameter() {
    const fetchDimension = async () => {
        Toast.error(`Update "anyway" dimension? This will permanently Update the dimension. Are you sure?`, {
            confirmText: 'Update',
            cancelText: 'Cancel',
        });

        const ok = await Toast.promise(`Update "anyway" dimension? This will permanently Update the dimension. Are you sure?`, {
            confirmText: 'Update',
            cancelText: 'Cancel',
        });
        if (!ok) return;
    }
    useEffect(() => {
        // fetchDimension();
    }, [2000]);

    return (
        <div>

        </div>
    );
}