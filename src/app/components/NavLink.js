'use client';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children, activeClass, inactiveClass, className ='', type ='link' }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  // console.log("isActive",isActive, pathname, href)
  
  if (type && type.toLowerCase() === 'button') {
    activeClass = "cursor-pointer px-3 py-1.5 rounded-lg text-white bg-action";
    inactiveClass = "cursor-pointer px-3 py-1.5 rounded-lg text-secondary-text hover:text-action-hover bg-most-secondary"
  } else {
    activeClass = 'cursor-pointer text-action'
    inactiveClass = 'cursor-pointer text-secondary-text hover:text-action-hover'
  }

  return (
    <Link
      href={href}
      className={cn(`capitalize ${isActive ? activeClass : inactiveClass} ${className} `)}
    >
      {children}
    </Link>
  );
}