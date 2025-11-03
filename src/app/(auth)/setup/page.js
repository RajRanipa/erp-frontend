'use client'

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useUser } from '@/context/UserContext';
import { axiosInstance, startAccessTokenTimer } from '@/lib/axiosInstance';
import WizardShell from './components/WizardShell';
import { useToast } from '@/components/toast';

const fetcher = url => axiosInstance.get(url).then(r => r.data);

export default function SetupPage() {
  const router = useRouter();
  const toast = useToast();
  const notify = (type, message) => {
    // console.log("type, message", type, message)
    toast({
      type,
      message,
      duration: 4000,
      autoClose: true,
      placement: 'top-center',
      animation: 'top-bottom',
    });
  }
  const { companyId, companyName, userId, setUserContext } = useUser();
  // console.log("userId :- ", userId, )
  // console.log("companyId :- ",  companyId)
  // console.log("companyName :- ",   companyName)
  // ---- Decision Tree ----
  // 1) If neither userId nor companyId in context (fresh tab), hydrate from /api/auth/me
  const profileKey = !companyId && !userId ? '/api/auth/me' : null;
  const { data: profileRes, error: profileError, isLoading: profileLoading, mutate: mutateProfile } = useSWR(profileKey, fetcher, { revalidateOnFocus: false });
  const profile = profileRes?.data;

  // 2) Effective tenant presence (prefer context; else profile)
  const effectiveCompanyId = companyId || profile?.companyId || null;
  // console.log("profile", profile)
  // console.log("effectiveCompanyId", effectiveCompanyId, companyId, "||", profile?.companyId)
  // 3) If we have a tenant, fetch company via server-derived endpoint (safer than client id)
  const companyKey = effectiveCompanyId ? '/api/company/me' : null;
  console.log("companyKey", companyKey)
  const { data: companyRes, error: companyError, isLoading: companyLoading, mutate: mutateCompany } = useSWR(companyKey, fetcher, { revalidateOnFocus: false });
  const company = companyRes?.data;

  // ---- Local form state ----
  const initialData = useMemo(
    () => ({
      companyName: companyName || '',
      industry: '',
      address: { street: '', city: '', state: '', country: '', postalCode: '' },
      taxInfo: { panNumber: '', gstNumber: '', taxRegion: '' },
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      enabledModules: [],
      setupProgress: {},
    }),
    [companyName]
  );

  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    startAccessTokenTimer();
  }, []);

  // Merge server company data into local state once available
  useEffect(() => {
    if (!company) return;
    setFormData(prev => ({
      ...prev,
      ...company,
      address: { ...prev.address, ...(company.address || {}) },
      taxInfo: { ...prev.taxInfo, ...(company.taxInfo || {}) },
      enabledModules: company.enabledModules ?? prev.enabledModules,
      setupProgress: { ...(prev.setupProgress || {}), ...(company.setupProgress || {}) },
    }));
  }, [company]);

  // ---- Validation per step (frontend guard) ----
  function validateStep(stepKey, candidate) {
    const errors = {};
    switch (stepKey) {
      case 'companyBasics': {
        if (!candidate.companyName || !candidate.companyName.trim()) {
          errors.companyName = 'Company name is required';
        }
        break;
      }
      case 'address': {
        if (!candidate.address?.country || !candidate.address.country.trim()) {
          errors.country = 'Country is required';
        }
        break;
      }
      case 'taxInfo': {
        const pan = candidate.taxInfo?.panNumber?.trim();
        const gst = candidate.taxInfo?.gstNumber?.trim();
        if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
          errors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
        }
        if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/i.test(gst)) {
          errors.gstNumber = 'Invalid GSTIN format (15 chars)';
        }
        break;
      }
      case 'localization': {
        if (!candidate.currency || !candidate.currency.trim()) {
          errors.currency = 'Currency is required';
        }
        if (!candidate.timezone || !candidate.timezone.trim()) {
          errors.timezone = 'Timezone is required';
        }
        break;
      }
      case 'logo': {
        const hasLogo = !!candidate.logoUrl;
        if (!hasLogo) {
          errors.logoUrl = 'Please upload or provide a logo URL';
        }
        break;
      }
      case 'modules': {
        if (!Array.isArray(candidate.enabledModules) || candidate.enabledModules.length === 0) {
          errors.enabledModules = 'Select at least one module';
        }
        break;
      }
      default:
        break;
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }

  // ---- Save handler ----
  async function handleSave(stepKey, partial) {
    try {
      setSaving(true);

      // Compose candidate values (current form + new partial)
      const candidate = {
        ...formData,
        ...partial,
        address: partial.address ? { ...(formData.address || {}), ...(partial.address || {}) } : formData.address,
        taxInfo: partial.taxInfo ? { ...(formData.taxInfo || {}), ...(partial.taxInfo || {}) } : formData.taxInfo,
        enabledModules: partial.enabledModules ?? formData.enabledModules,
        logoUrl: partial.logoUrl ?? formData.logoUrl,
        currency: partial.currency ?? formData.currency,
        timezone: partial.timezone ?? formData.timezone,
      };

      console.log('Candidate:', candidate, 'formData', partial);
      const { ok, errors } = validateStep(stepKey, candidate);
      if (!ok) {
        console.warn('Validation failed:', errors);
        notify('error', 'Validation failed. Please fix the errors before continuing.');
        return false; // signal failure to the shell
      }

      // Optimistic local merge
      setFormData(prev => ({
        ...prev,
        ...partial,
        address: partial.address ? { ...(prev.address || {}), ...(partial.address || {}) } : prev.address,
        taxInfo: partial.taxInfo ? { ...(prev.taxInfo || {}), ...(partial.taxInfo || {}) } : prev.taxInfo,
        enabledModules: partial.enabledModules ?? prev.enabledModules,
        setupProgress: {
          ...(prev.setupProgress || {}),
          ...(partial.setupProgress || {}),
          ...(stepKey ? { [stepKey]: true } : {}),
        },
      }));

      const payload = {
        ...partial,
        setupProgress: { ...(partial?.setupProgress || {}), ...(stepKey ? { [stepKey]: true } : {}) },
      };
      console.log('effectiveCompanyId:', effectiveCompanyId,'stepKey', stepKey, 'payload', payload);

      // Branch: if no company yet, Step 1 should create/link the company
      if (!effectiveCompanyId && stepKey === 'companyBasics') {
        try {
          const res = await axiosInstance.post('/api/company', payload);
          // when res come it will sent company details name and id we need to save this in UserContext file 
          const okStatus = res?.status >= 200 && res?.status < 300;
          const created = res?.data?.data;

          if (!okStatus || !created?._id) {
            notify('error', 'Failed to create company. Please try again.');
            return false;
          }
          setUserContext({ companyId: created._id, companyName: created.companyName || formData.companyName });
          await Promise.all([mutateProfile?.(), mutateCompany?.()]);
          notify('success', 'Company created successfully!');
          return true;
        } catch (err) {
          console.error('Failed to create company:', err);
          notify('error', err?.response?.data?.message || 'Failed to create company. Please try again.');
          return false;
        }
      } else {
        // Update existing tenant
        console.log("payload company patch patch patch patch  ", payload)
        const upd = await axiosInstance.patch('/api/company', payload);
        const okUpd = upd?.status >= 200 && upd?.status < 300 && (upd?.data?.status ?? true);
        if (!okUpd) {
          notify('error', 'Failed to save changes. Please try again.');
          return false; // do not advance
        }
        await mutateCompany?.();
        notify('success', 'Changes saved successfully!');
        return true;
      }
      return false;
    }
    finally {
      setSaving(false);
    }
  }


  // ---- Finish handler ----
  async function handleFinish() {
    try {
      setSaving(true);
      await axiosInstance.post('/api/company/finish');
      notify('success', 'Setup completed successfully! Redirecting...');
      router.push('/dashboard');
    } catch (err) {
      notify('error', 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => {
    const res = axiosInstance.post('/logout');
    console.log('res', res);
  } 

  const renderBody = () => {
    if (!mounted) {
      return null; // or a skeletal placeholder div
    }
    if (companyKey && companyLoading) {
      return <div className="p-4">Loading company details…</div>;
    }
    if (companyError) {
      return <div className="p-4 text-red-500">Failed to load company details.</div>;
    }
    console.log('formData formData formData formData formData', formData)
    if(formData) return (
      <WizardShell
        formData={formData}
        setupProgress={formData?.setupProgress}
        serverProgress={company?.setupProgress || {}}
        saving={saving}
        onSave={handleSave}
        onFinish={handleFinish}
      />
    );
  };

  return (
    <div className="p-4 w-full h-full overflow-hidden text-primary-text flex flex-col">
      <div className='flex items-center justify-between py-2'>
        <h1 className='px-4 py-2 text-2xl font-medium'>Setup your company details</h1>
        <button className='btn-most' onClick={handleLogout}>log out</button>
      </div>
      {renderBody()}
    </div>
  );
}