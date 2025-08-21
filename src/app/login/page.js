'use client'; // This directive is crucial

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomInput from '@/components/CustomInput';
import { axiosInstance, setAccessTokenExpireAt, startAccessTokenTimer } from '../../lib/axiosInstance';

const LoginContent = () => {
  // const redirectTo =  '/dashboard';
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  // const [auth, setAuth] = useState(false);
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axiosInstance.post('/login', form, { withCredentials: true });
      console.log('Login success response:', res.data);
      console.log('accessTokenExpireAt', res.data.accessTokenExpireAt);
      // 1️⃣ Save the expiry timestamp globally
      setAccessTokenExpireAt(res.data.accessTokenExpireAt);

      // 2️⃣ Start the proactive refresh timer
      startAccessTokenTimer();

      // 3️⃣ Redirect user to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 shadow-md rounded"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <CustomInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <CustomInput
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginContent;