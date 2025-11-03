'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomInput from '@/Components/inputs/CustomInput';
import { axiosInstance } from '@/lib/axiosInstance';

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
      // console.log(process.env.NEXT_PUBLIC_Backend_url)
      const res = await axiosInstance.post('/signup', form, { withCredentials: true });

      const data = res.data;
      
      if (!data.status) {
        console.log('Signup error:', data);
        throw new Error(data.message || 'Signup failed');
      }

      router.push('/login');
    } catch (err) {
      console.log(err.response.data.details);
      let message=''
      if(!err?.response?.data?.status || false){
        if(Array.isArray(err.response.data?.details)){
          message = err?.response?.data?.details.map((err) => err.message).join(', ');
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-most p-8 shadow-md rounded-lg flex flex-col items-center gap-2"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-primary-text ">Create Account</h2>

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

        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full my-3"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center text-secondary-text mt-4">
          Already have an account?{' '}
          <span
            className="text-action hover:underline cursor-pointer"
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