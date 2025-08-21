'use client';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen w-full px-4 flex flex-col justify-between relative">
      <div className="absolute top-0 left-0 h-screen w-full z-0 pointer-events-none">
        <Image
          src="/logo.png"
          alt="Logo"
          width={800}
          height={800}
          className="w-[50%] h-auto object-cover opacity-6 relative top-0 left-0 scale-[1.4]"
          priority
        />
      </div>
      <div className="flex justify-between items-center py-2 relative z-10">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="mr-2"
          />
          <h1 className="text-3xl font-bold">ERP</h1>
        </div>
        <div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
            onClick={() => router.push('/login')}
          >
            Login
          </button>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded ml-2 cursor-pointer"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-full w-full relative z-10">
        <h1 className="text-5xl font-bold mb-4 flex items-center bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Welcome to the ERP</h1>
        <p className="text-lg">
          This is a simple ERP application built with Next.js and Tailwind CSS.
        </p>
      </div>
      <footer className="text-center py-4 footer relative z-10">
        <p className="mb-2">Learn more about us</p>
        <Link href="https://www.orientfibertech.com/" target="_blank" className="transition-all duration-300 ease-in-out  hover:text-[#02afef] hover:scale-[1.2]">Orient Ceramic Fibertech LLP</Link>
        <p className="mt-2 text-sm text-gray-400">© 2023 ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}
