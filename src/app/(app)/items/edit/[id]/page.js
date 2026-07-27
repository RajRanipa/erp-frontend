// src/app/items/edit/[id]/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ItemForm from '../../components/ItemForm';
import { axiosInstance } from '@/lib/axiosInstance';
import Loading from '@/Components/Loading';
import { Toast } from '@/Components/toast';

export default function EditProductPage() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        async function fetchItem() {
            try {
                setLoading(true);
                setError('');
                const queryParams = { id };
                const res = await axiosInstance.get(`/api/items/by-id`, { params: queryParams });
                if (active && res.data) {
                    setItem(res.data);
                }
            } catch (error) {
                if (!active) return;
                const message = error?.response?.data?.message || 'Failed to load Item';
                setError(message);
                setItem(null);
                Toast.error(message);
            } finally {
                if (active) setLoading(false);
            }
        }
        if (id) {
            fetchItem();
        }
        return () => {
            active = false;
        };
    }, [id]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Edit Item</h1>
            {loading && <Loading variant="skeleton" className="h-72" />}
            {!loading && error && <div className="text-error">{error}</div>}
            {!loading && item && <ItemForm initialData={item} mode="edit" />}
        </div>
    );
}
