// src/app/utils/checkAuth.js
'use client';
import { Toast } from "@/Components/toast";
import { axiosInstance } from "@/lib/axiosInstance";
import { useRouter } from 'next/navigation';

/**
 * useCheckAuth
 * Hook that returns an async function `checkAuth` which:
 * - calls /check-auth
 * - updates the user context via the setter you pass in
 * - redirects based on isSetupCompleted
 *
 * Usage:
 *   const { checkAuth } = useCheckAuth();
 *   useEffect(() => { checkAuth(setUserContext); }, []);
 */
export function useCheckAuth() {
  const router = useRouter();
  
  const checkAuth = async (setUserContext) => {
    try {
      const res = await axiosInstance.get('/auth/checkAuth');
      console.log('getUser /check-auth response:', res.data);
      if (res.data?.status) {
        // Update global context with user info
        setUserContext({
          userId: res.data.user.userId,
          companyId: res.data.user.companyId,
          role: res.data.user.role,
          companyName: res.data.user.companyName || '',
          userName: res.data.user.userName || '',
          permissions: res.data.user.permissions || [],
        });

        // Redirect based on setup
        if (!res.data.user.isSetupCompleted) {
          router.push('/setup');
        } else {
          router.push('/setup');
        }
      }
    } catch (err) {
      Toast.error(err?.response?.data?.message || 'Failed to check authentication. Please try again.');
      console.error('getUser error:', err);
    }
  };

  return { checkAuth };
}