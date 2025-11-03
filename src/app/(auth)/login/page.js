'use client'; // This directive is crucial

import { useState, useEffect } from 'react';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance, setAccessTokenExpireAt, startAccessTokenTimer } from '@/lib/axiosInstance';
import { useUser } from '@/context/UserContext';
import { useCheckAuth } from '@/utils/checkAuth';

const LoginContent = () => {
  // const redirectTo =  '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { setUserContext } = useUser();
  const { checkAuth } = useCheckAuth();
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axiosInstance.post('/login', form, { withCredentials: true });
      console.log('Login success response:', res.data);
      console.log('accessTokenExpireAt', res.data.accessTokenExpireAt);
      // Save the expiry timestamp globally
      if (res.data.accessTokenExpireAt) setAccessTokenExpireAt(res.data.accessTokenExpireAt);

      if (res.data.status) {
        // Update global context with user info
        checkAuth(setUserContext);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || 'Login failed');
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-most p-8 shadow-md rounded-lg flex flex-col items-center gap-2"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-primary-text">Login</h2>

        <CustomInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <div className="relative w-full">
          <CustomInput
            label="Password"
            name="password"
            type={'password'}
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <button
          type="submit"
          className="btn-primary w-full my-3"
        >
          Login
        </button>

        <p className="text-center text-sm text-secondary-text mt-4">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-action hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
export default LoginContent;