'use client';
import { cn } from '../utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children, activeClass, inactiveClass, className ='', type ='link', onClick = () => {} }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  // console.log("isActive",isActive, pathname, href)
  
  if (type && type.toLowerCase() === 'button') {
    activeClass = "btn-primary";
    inactiveClass = "cursor-pointer px-3 py-1.5 rounded-lg text-secondary-text hover:text-action-hover bg-most-secondary "
  } else {
    activeClass = 'cursor-pointer text-action'
    inactiveClass = 'cursor-pointer text-secondary-text hover:text-action-hover'
  }

  return (
    <Link
      href={href}
      className={cn(`capitalize text-sm md:text-base ${isActive ? activeClass : inactiveClass} ${className} `)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}