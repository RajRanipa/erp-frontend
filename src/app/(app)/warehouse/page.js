// src/app/warehouse/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import DisplayMain from '@/components/layout/DisplayMain';
import DisplayBar from '@/components/layout/DisplayBar';
import NavLink from '@/components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast, useConfirmToast } from '@/components/toast';
import { useRouter } from 'next/navigation';

export default function WarehousePage({ children, setTitle, setHref }) {
    const toast = useToast();
    const confirmToast = useConfirmToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/warehouses');
            const data = res?.data?.data ?? res?.data ?? [];
            setWarehouses(Array.isArray(data) ? data : []);
        } catch (err) {
            toast({ type: 'error', message: err?.response?.data?.message || 'Failed to load warehouses' });
            setWarehouses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    useEffect(() => {
        
        if (setTitle) setTitle("Warehouse");
        if (setHref) setHref("/warehouse");
    }, [setTitle, setHref]);

    const handleDelete = async (id, name, triggerEl) => {
        const ok = await confirmToast(`Delete ${name} warehouse? This action cannot be undone.`, {
            type: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            placement: 'top-center',
            animation: 'top-bottom',
            focusTarget: triggerEl,
        });
        if (!ok) return;
        try {
            await axiosInstance.delete(`/api/warehouses/${id}`);
            setWarehouses(prev => prev.filter(x => x._id !== id));
            toast({
                type: 'success',
                message: 'Warehouse deleted',
                duration: 3000,
                autoClose: true,
                placement: 'top-center',
                animation: 'top-bottom',
            });
        } catch (err) {
            toast({
                type: 'error',
                message: err?.response?.data?.message || 'Failed to delete warehouse',
                duration: 4000,
                autoClose: true,
                placement: 'top-center',
                animation: 'top-bottom',
            });
        }
    };

    return (
        <>
            <DisplayBar title="warehouse" href="/warehouse">
                <div className="flex items-center justify-between w-full">
                    <div>
                    </div>
                    <div className='flex gap-2'>
                        <NavLink href={'/warehouse/create'} type="button">create warehouse</NavLink>
                    </div>
                </div>
            </DisplayBar>

            <DisplayMain>
                {children ?? (
                    <div>
                        <h1 className="text-2xl font-semibold mb-4">Warehouse Dashboard</h1>

                        {loading ? (
                            <div>Loading…</div>
                        ) : warehouses.length === 0 ? (
                            <div className="bg-most-secondary p-4 rounded">No warehouses found. <NavLink href="/warehouse/create" className="underline">Create one</NavLink></div>
                        ) : (
                            <div className="bg-most-secondary p-4 rounded-lg shadow-md overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-color-300">
                                            <th className="py-2 pr-4">Code</th>
                                            <th className="py-2 pr-4">Name</th>
                                            <th className="py-2 pr-4">Address</th>
                                            <th className="py-2 pr-4">Pincode</th>
                                            <th className="py-2 pr-4">State</th>
                                            <th className="py-2 pr-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {warehouses.map((w) => (
                                            <tr key={w._id} className="border-b border-color-300 hover:bg-black-100">
                                                <td className="py-2 pr-4 font-medium">{w.code}</td>
                                                <td className="py-2 pr-4">{w.name}</td>
                                                <td className="py-2 pr-4">{w.address ?? '—'}</td>
                                                <td className="py-2 pr-4">{w.pincode ?? '—'}</td>
                                                <td className="py-2 pr-4">{w.state ?? '—'}</td>
                                                <td className="py-2 pr-4 flex gap-2">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <NavLink href={`/warehouse/${w._id}/edit`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                                                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 19.5l1.037-5.25L16.862 3.487z" />
                                                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" />
                                                            </svg>
                                                        </NavLink>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDelete(w._id, w.name || w.code || 'this', e.currentTarget)}
                                                            className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-100 text-error focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-error cursor-pointer"
                                                            aria-label="Delete campaign"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                                                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7v10m6-10v10M4 7h16l-1 13a2 2 0 01-2 2H7a2 2 0 01-2-2L4 7z" />
                                                                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z" />
                                                            </svg>
                                                        </button></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </DisplayMain>
        </>
    );
}