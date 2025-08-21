'use client';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children, activeClass, inactiveClass, className }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(`capitalize ${className} ${isActive ? activeClass : inactiveClass}`)}
    >
      {children}
    </Link>
  );
}