'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/Components/toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { cn } from '@/utils/cn';
import { logoutIcon } from '@/utils/SVG';
import { useUser } from '@/context/UserContext';

export default function LogOutBtn({ variant = 'icon', className = '' }) {
    const router = useRouter();
    const { clearUserContext } = useUser();

    const handleLogout = async () => {
        const ok = await Toast.promise('Are you sure you want to logout?',{
            title: 'Logout Confirmation',
            confirmLabel: 'Logout',
            cancelLabel: 'Cancel',
        });
        if (!ok) return;

        try {
            const res = await axiosInstance.post('/logout');
            console.log('res', res);
            if (res?.data?.status === true) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                sessionStorage.clear();
                clearUserContext();
                Toast.info('You have been logged out.');
                router.push('/login');
            } else {
                Toast.error(res?.data?.message || 'Logout failed. Please try again.');
            }
        } catch (err) {
            console.error('Logout error:', err);
            Toast.error('Failed to logout. Please try again.');
        }
    };

    const base =
        'flex items-center justify-center transition-all duration-150 focus:outline-none rounded-md';
    const variants = {
        icon: 'p-2 hover:bg-white-100 text-white-800',
        text: 'text-sm text-white-800 hover:underline px-2',
        outline: 'border border-white-300 text-white-800 px-3 py-1 hover:bg-white-100',
        danger: 'bg-red-600 text-white px-3 py-1 hover:bg-red-700',
        minimal: 'text-white-500 hover:text-white-800',
    };

    return (
        <button
            aria-label="logout"
            className={cn(base, variants[variant], className)}
            onClick={handleLogout}
            type="button"
        >
            {variant === 'icon' ? (
                logoutIcon()
            ) : (
                'Logout'
            )}
        </button>
    );
}