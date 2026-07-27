'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Toast } from '@/Components/toast';
import { useUser } from '@/context/UserContext';
import CustomInput from '@/Components/inputs/CustomInput';
import SelectInput from '@/Components/inputs/SelectInput';
import CheckBox from '@/Components/inputs/CheckBox';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { axiosInstance, clearAccessTokenTimer } from '@/lib/axiosInstance';

const TABS = ['Profile', 'Security', 'Sessions', 'Preferences'];

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

export default function MyAccount() {
  const userContext = useUser();
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ fullName: '', email: '' });
  const [initialName, setInitialName] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    notifications: { emailUpdates: true, inAppAlerts: true },
  });
  const [initialPreferences, setInitialPreferences] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailChange, setEmailChange] = useState({ email: '', currentPassword: '', otp: '', started: false });
  const [sessions, setSessions] = useState([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users/me');
      const account = response?.data?.user;
      const nextPreferences = {
        theme: account?.preferences?.theme || 'light',
        language: account?.preferences?.language || 'en',
        notifications: {
          emailUpdates: account?.preferences?.notifications?.emailUpdates ?? true,
          inAppAlerts: account?.preferences?.notifications?.inAppAlerts ?? true,
        },
      };
      setProfile({ fullName: account?.fullName || '', email: account?.email || '' });
      setInitialName(account?.fullName || '');
      setPreferences(nextPreferences);
      setInitialPreferences(JSON.stringify(nextPreferences));
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to load account.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/auth/sessions');
      setSessions(response?.data?.data || []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to load sessions.');
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'Sessions') loadSessions();
  }, [activeTab, loadSessions]);

  const preferencesDirty = useMemo(
    () => initialPreferences && JSON.stringify(preferences) !== initialPreferences,
    [initialPreferences, preferences],
  );

  const reauthenticate = (message) => {
    clearAccessTokenTimer();
    userContext.clearUserContext();
    Toast.success(message);
    window.location.replace('/login');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put('/api/myaccount/profile', { fullName: profile.fullName });
      const updatedName = response?.data?.user?.fullName || profile.fullName;
      setInitialName(updatedName);
      userContext.setUserName(updatedName);
      Toast.success('Profile updated.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      Toast.error('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/change-password', password);
      reauthenticate(response?.data?.message || 'Password updated.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to update password.');
      setLoading(false);
    }
  };

  const startEmailChange = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/change-email/start', {
        email: emailChange.email,
        currentPassword: emailChange.currentPassword,
      });
      setEmailChange((value) => ({ ...value, started: true, otp: '' }));
      Toast.success(response?.data?.message || 'Verification code sent.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to start email change.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailChange = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/change-email/verify', { otp: emailChange.otp });
      reauthenticate(response?.data?.message || 'Email updated.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to verify email.');
      setLoading(false);
    }
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put('/api/myaccount/preferences', preferences);
      const saved = response?.data?.preferences || preferences;
      setPreferences(saved);
      setInitialPreferences(JSON.stringify(saved));
      Toast.success('Preferences updated.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to update preferences.');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (session) => {
    try {
      const response = await axiosInstance.delete(`/auth/sessions/${session.sessionId}`);
      if (response?.data?.currentSessionRevoked) {
        reauthenticate('Current session revoked.');
        return;
      }
      Toast.success('Session revoked.');
      await loadSessions();
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to revoke session.');
    }
  };

  const logoutEverywhere = async () => {
    const confirmed = await Toast.promise('Sign out every device, including this one?', {
      title: 'Sign out all sessions',
      confirmLabel: 'Sign out all',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    try {
      const response = await axiosInstance.post('/auth/logout-all');
      reauthenticate(response?.data?.message || 'All sessions signed out.');
    } catch (error) {
      Toast.error(error?.response?.data?.message || 'Failed to sign out sessions.');
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-white-100 bg-white-100 p-3">
        <div className="mb-4 px-2">
          <h1 className="text-lg font-semibold">My account</h1>
          <p className="text-xs text-white-500">{profile.email}</p>
        </div>
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeTab === tab ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="mt-6 border-t border-white-100 px-2 pt-4 text-xs text-white-500">
          <div>{userContext.roleName || userContext.role}</div>
          <div>{userContext.companyName || 'No company selected'}</div>
        </div>
      </aside>

      <section className="min-h-0 overflow-auto rounded-xl border border-white-100 bg-white-100 p-5">
        {loading && !profile.email ? <div className="text-white-500">Loading account…</div> : null}

        {activeTab === 'Profile' && (
          <div className="max-w-xl space-y-8">
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-white-500">Your personal identity across company memberships.</p>
            </div>
            <form onSubmit={saveProfile}>
              <CustomInput
                label="Full name"
                value={profile.fullName}
                onChange={(event) => setProfile((value) => ({ ...value, fullName: event.target.value }))}
                required
              />
              <CustomInput label="Login email" value={profile.email} readOnly info="Use verified email change below." />
              <SubmitButton disabled={loading || profile.fullName.trim() === initialName} loading={loading} className='mt-4'>
                Save profile
              </SubmitButton>
            </form>

            <div className="py-6">
              <h3 className="font-semibold">Change login email</h3>
              <p className="mb-4 text-sm text-white-500">Your new address must be verified before it replaces the current one.</p>
              {!emailChange.started ? (
                <form onSubmit={startEmailChange}>
                  <CustomInput
                    label="New email"
                    type="email"
                    value={emailChange.email}
                    onChange={(event) => setEmailChange((value) => ({ ...value, email: event.target.value }))}
                    required
                  />
                  <CustomInput
                    label="Current password"
                    type="password"
                    value={emailChange.currentPassword}
                    onChange={(event) => setEmailChange((value) => ({ ...value, currentPassword: event.target.value }))}
                    required
                  />
                  <SubmitButton loading={loading}>Send verification code</SubmitButton>
                </form>
              ) : (
                <form onSubmit={verifyEmailChange}>
                  <CustomInput
                    label={`Code sent to ${emailChange.email}`}
                    inputMode="numeric"
                    value={emailChange.otp}
                    onChange={(event) => setEmailChange((value) => ({ ...value, otp: event.target.value }))}
                    required
                  />
                  <div className="flex gap-2">
                    <SubmitButton loading={loading}>Verify and change email</SubmitButton>
                    <button type="button" className="btn-secondary px-3" onClick={() => setEmailChange((value) => ({ ...value, started: false, otp: '' }))}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold">Password security</h2>
            <p className="mb-6 text-sm text-white-500">
              Updating your password immediately revokes every active session.
            </p>
            <form onSubmit={changePassword}>
              <CustomInput
                label="Current password"
                type="password"
                value={password.currentPassword}
                onChange={(event) => setPassword((value) => ({ ...value, currentPassword: event.target.value }))}
                required
              />
              <CustomInput
                label="New password"
                type="password"
                value={password.newPassword}
                onChange={(event) => setPassword((value) => ({ ...value, newPassword: event.target.value }))}
                info="At least 10 characters with uppercase, lowercase, and a number."
                required
              />
              <CustomInput
                label="Confirm new password"
                type="password"
                value={password.confirmPassword}
                onChange={(event) => setPassword((value) => ({ ...value, confirmPassword: event.target.value }))}
                required
              />
              <SubmitButton loading={loading}>Update password</SubmitButton>
            </form>
          </div>
        )}

        {activeTab === 'Sessions' && (
          <div>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Active sessions</h2>
                <p className="text-sm text-white-500">Review devices that can access your account.</p>
              </div>
              <button type="button" className="btn-danger px-3 py-2" onClick={logoutEverywhere}>Sign out all</button>
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.sessionId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white-100 p-4">
                  <div>
                    <div className="font-medium">
                      {session.device || 'Unknown device'}
                      {session.current && <span className="ml-2 text-xs text-emerald-400">Current session</span>}
                    </div>
                    <div className="text-xs text-white-500">
                      {session.ip || 'Unknown IP'} · Started {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}
                    </div>
                  </div>
                  <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => revokeSession(session)}>
                    Revoke
                  </button>
                </div>
              ))}
              {!sessions.length && <div className="rounded-xl border border-white-100 p-5 text-white-500">No refresh sessions found.</div>}
            </div>
          </div>
        )}

        {activeTab === 'Preferences' && (
          <form onSubmit={savePreferences} className="max-w-xl">
            <h2 className="text-lg font-semibold">Preferences</h2>
            <p className="mb-6 text-sm text-white-500">Customize your personal ERP experience.</p>
            <SelectInput
              label="Theme"
              value={preferences.theme}
              onChange={(event) => setPreferences((value) => ({ ...value, theme: event.target.value }))}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System default' },
              ]}
            />
            <SelectInput
              label="Language"
              value={preferences.language}
              onChange={(event) => setPreferences((value) => ({ ...value, language: event.target.value }))}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
                { value: 'fr', label: 'French' },
              ]}
            />
            <div className="mb-6 space-y-3">
              <CheckBox
                name="emailUpdates"
                checked={preferences.notifications.emailUpdates}
                onChange={(event) => setPreferences((value) => ({
                  ...value,
                  notifications: { ...value.notifications, emailUpdates: event.target.checked },
                }))}
                checkText="Email updates"
              />
              <CheckBox
                name="inAppAlerts"
                checked={preferences.notifications.inAppAlerts}
                onChange={(event) => setPreferences((value) => ({
                  ...value,
                  notifications: { ...value.notifications, inAppAlerts: event.target.checked },
                }))}
                checkText="In-app alerts"
              />
            </div>
            <SubmitButton disabled={!preferencesDirty || loading} loading={loading}>Save preferences</SubmitButton>
          </form>
        )}
      </section>
    </div>
  );
}
