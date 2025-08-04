'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/components/CustomInput';
import { api } from '../../lib/axiosInstance';

const Signup = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      console.log(process.env.NEXT_PUBLIC_Backend_url)
      const res = await api.post('/signup', form, { withCredentials: true });

      const data = res.data;
      
      if (!data.status) {
        throw new Error(data.message || 'Signup failed');
      }

      alert('Signup successful!');
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 shadow-md rounded"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <CustomInput
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={handleChange}
          required
        />

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

        <CustomInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4 transition"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center mt-4">
          Already have an account?{' '}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => router.push('/login')}
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;