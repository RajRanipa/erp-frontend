'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from '@/Components/toast';
import { useUser } from '@/context/UserContext';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';
import SubmitButton from '@/Components/buttons/SubmitButton';
import SelectInput from '@/Components/inputs/SelectInput';
import CheckBox from '@/Components/inputs/CheckBox';

const TABS = ['Profile', 'Security', 'Preferences'];

export default function MyAccount() {
    const user = useUser();
    const securityFormRef = useRef(null);
    const [activeTab, setActiveTab] = useState('Profile');
    const [loading, setLoading] = useState(false);
    const [initialProfile, setInitialProfile] = useState(null);
    const [initialPrefs, setInitialPrefs] = useState(null);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
    });

    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [prefsForm, setPrefsForm] = useState({
        theme: 'light',
        language: 'en',
        notifications: {
            emailUpdates: true,
            inAppAlerts: true,
        },
    });
    const fetchUserInfo = async (id) => {
        setLoading(true);
        try {

            const res = await axiosInstance.get(`/api/users/me/${id}`);
            if (res.data.status) {
                const u = res.data.user;

                setInitialProfile({
                    fullName: u.fullName || '',
                    email: u.email || '',
                });

                setInitialPrefs({
                    theme: u.preferences?.theme || 'light',
                    language: u.preferences?.language || 'en',
                    notifications: {
                        emailUpdates:
                            u.preferences?.notifications?.emailUpdates !== undefined
                                ? u.preferences.notifications.emailUpdates
                                : true,
                        inAppAlerts:
                            u.preferences?.notifications?.inAppAlerts !== undefined
                                ? u.preferences.notifications.inAppAlerts
                                : true,
                    },
                });

                // ✅ live form values set from backend
                setProfileForm({
                    fullName: u.fullName || '',
                    email: u.email || '',
                });

                setPrefsForm({
                    theme: u.preferences?.theme || 'light',
                    language: u.preferences?.language || 'en',
                    notifications: {
                        emailUpdates:
                            u.preferences?.notifications?.emailUpdates !== undefined
                                ? u.preferences.notifications.emailUpdates
                                : true,
                        inAppAlerts:
                            u.preferences?.notifications?.inAppAlerts !== undefined
                                ? u.preferences.notifications.inAppAlerts
                                : true,
                    },
                });
            }
        } catch (e) {
            Toast.error(e?.response?.data?.message || 'Failed to load user info');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user?.userId) fetchUserInfo(user?.userId);
    }, [user])

    const profileDirty =
        initialProfile &&
        (initialProfile.fullName !== profileForm.fullName ||
            initialProfile.email !== profileForm.email);

    const prefsDirty =
        initialPrefs &&
        (initialPrefs.theme !== prefsForm.theme ||
            initialPrefs.language !== prefsForm.language ||
            initialPrefs.notifications.emailUpdates !==
            prefsForm.notifications.emailUpdates ||
            initialPrefs.notifications.inAppAlerts !==
            prefsForm.notifications.inAppAlerts);

    const securityDirty =
        Boolean(
            securityForm.currentPassword ||
            securityForm.newPassword ||
            securityForm.confirmPassword
        );

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // TODO: call /settings/myaccount/profile API
            await axiosInstance.put('/api/myaccount/profile', profileForm);
            Toast.success('Profile updated (frontend only for now)');
        } catch (err) {
            Toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSecuritySave = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (securityForm.newPassword !== securityForm.confirmPassword) {
        Toast.error('New passwords do not match');
        setLoading(false);
        return;
    }
    try {
        await axiosInstance.post('/auth/change-password', securityForm);
        Toast.success('Password updated successfully');
        setSecurityForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    } catch (err) {
        Toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
        setLoading(false);
    }
};

    const handlePrefsSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // TODO: call /settings/myaccount/preferences API
            await axiosInstance.put('/api/myaccount/preferences', prefsForm);
            Toast.success('Preferences saved (frontend only for now)');

        } catch (err) {
            Toast.error('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-6  mx-auto">
            {/* LEFT NAV */}
            <aside className="w-56 flex-shrink-0">
                <h1 className="text-xl font-semibold mb-4">My account</h1>
                <nav className="space-y-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab === tab
                                ? 'bg-black-500 text-secondary-text'
                                : 'text-secondary-text hover:bg-black-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 text-xs text-white-500 space-y-1 px-2 flex flex-col gap-1">
                    <div>
                        Role:{' '}
                        <span className="font-medium capitalize">
                            {user?.role || '—'}
                        </span>
                    </div>
                    <div>
                        Company:{' '}
                        <span className="font-medium">
                            {user?.companyName || '—'}
                        </span>
                    </div>
                </div>
            </aside>

            {/* RIGHT CONTENT */}
            <section className="flex-1 space-y-6">
                <div className="bg-white-100/50 rounded-lg border border-white-100 shadow-sm px-6 py-4 space-y-4">
                    {activeTab === 'Profile' && (
                        <>
                            <div className='flex items-start justify-center flex-col w-full mb-6'>
                                <h2 className="text-lg font-semibold text-most-secondary-text">Profile</h2>
                                <p className="text-sm text-secondary-text">
                                    Manage your personal information.
                                </p>
                            </div>

                            <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
                                <div>
                                    <CustomInput
                                        label="Full name"
                                        type="text"
                                        value={profileForm.fullName}
                                        onChange={(e) =>
                                            setProfileForm((f) => ({ ...f, fullName: e.target.value }))
                                        }
                                        className="form-input w-full"
                                    />
                                </div>

                                <div>
                                    <CustomInput
                                        label="Email (login)"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) =>
                                            setProfileForm((f) => ({ ...f, email: e.target.value }))
                                        }
                                        className="form-input w-full"
                                    />
                                </div>

                                <SubmitButton type="submit" disabled={!profileDirty || loading}>
                                    Save changes
                                </SubmitButton>
                            </form>
                        </>
                    )}

                    {activeTab === 'Security' && (
                        <>
                            <div className='flex items-start justify-center flex-col w-full mb-6'>
                                <h2 className="text-lg font-semibold text-most-secondary-text">Security</h2>
                                <p className="text-sm text-secondary-text">
                                    Update your password and secure your account.
                                </p>
                            </div>

                            <form onSubmit={handleSecuritySave} className="space-y-4 max-w-md" ref={securityFormRef}>
                                <div>
                                    <CustomInput
                                        label="Current password"
                                        type="password"
                                        name={'currentPassword'}
                                        value={securityForm.currentPassword}
                                        onChange={(e) =>
                                            setSecurityForm((f) => ({ ...f, currentPassword: e.target.value }))
                                        }
                                        className="w-full"
                                        parent_className='mb-7'
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <CustomInput
                                            label="New password"
                                            type="password"
                                            name={'newPassword'}
                                            value={securityForm.newPassword}
                                            onChange={(e) =>
                                                setSecurityForm((f) => ({ ...f, newPassword: e.target.value }))
                                            }
                                            className=" w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <CustomInput
                                            label="Confirm password"
                                            type="password"
                                            name={'confirmPassword'}
                                            value={securityForm.confirmPassword}
                                            onChange={(e) =>
                                                setSecurityForm((f) => ({ ...f, confirmPassword: e.target.value }))
                                            }
                                            className=" w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <SubmitButton
                                    type="submit"
                                    disabled={!securityDirty || loading}
                                    loading={loading}
                                >
                                    Update password
                                </SubmitButton>
                            </form>
                        </>
                    )}

                    {activeTab === 'Preferences' && (
                        <>
                            <div className='flex items-start justify-center flex-col w-full mb-6'>
                                <h2 className="text-lg font-semibold text-most-secondary-text">Preferences</h2>
                                <p className="text-sm text-secondary-text">
                                    Customize how the ERP behaves for you.
                                </p>
                            </div>
                            <form onSubmit={handlePrefsSave} className="space-y-4 max-w-md">
                                <div>
                                    <SelectInput
                                        label='theme'
                                        options={[
                                            { value: 'light', label: 'Light' },
                                            { value: 'dark', label: 'Dark' },
                                            { value: 'system', label: 'System default' },
                                        ]}
                                        value={prefsForm.theme}
                                        onChange={(e) =>
                                            setPrefsForm((f) => ({ ...f, theme: e.target.value }))
                                        }
                                    />
                                </div>

                                <div>
                                    {/* Add more languages later as needed */}
                                    <SelectInput
                                        label='language'
                                        options={[
                                            { value: 'en', label: 'English' },
                                        ]}
                                        value={prefsForm.language}
                                        onChange={(e) =>
                                            setPrefsForm((f) => ({ ...f, language: e.target.value }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium mb-3">
                                        Notifications
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <CheckBox
                                            checked={!!prefsForm.notifications?.emailUpdates}
                                            onChange={(e) =>
                                                setPrefsForm((f) => ({
                                                    ...f,
                                                    notifications: {
                                                        ...f.notifications,
                                                        emailUpdates: e.target.checked,
                                                    },
                                                }))
                                            }
                                            checkText={'Email updates'}
                                            name={'emailUpdates'}
                                            info={'Receive email notifications about important updates and new features.'}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckBox
                                            checked={!!prefsForm.notifications?.inAppAlerts}
                                            onChange={(e) =>
                                                setPrefsForm((f) => ({
                                                    ...f,
                                                    notifications: {
                                                        ...f.notifications,
                                                        inAppAlerts: e.target.checked,
                                                    },
                                                }))
                                            }
                                            checkText={'In-app alerts'}
                                            name={'inAppAlerts'}
                                            info={'Receive in-app notifications about important updates and new features.'}
                                        />
                                    </div>
                                </div>

                                <SubmitButton type="submit" disabled={!prefsDirty || loading} loading={loading}>
                                    Save preferences
                                </SubmitButton>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
