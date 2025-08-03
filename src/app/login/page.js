'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/components/CustomInput';

const Login = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const base = process.env.NEXT_PUBLIC_Backend_url;
      console.log("base - ",base)
      const path = '/login';
      const url = new URL(path, base)
      console.log("url - ",url)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Store token and redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
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

export default Login;