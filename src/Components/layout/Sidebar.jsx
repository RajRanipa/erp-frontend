'use client';
import React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NavLink from '../NavLink';
import { cn } from '@/utils/cn';

// Memoized SidebarItem component
const SidebarItem = React.memo(function SidebarItem({
  open,
  setOpen,
  item,
  index,
  collapsed,
  active,
  navLinkClass,
  activeSpanClass,
  inactiveSpanClass,
}) {
  return (
    <NavLink
      key={index}
      href={item.href}
      className={navLinkClass}
      type="link"
      {...( open ? {onClick: () => setOpen(false)} : {} )}
    >
      <span className="text-xl">{item.icon}</span>
      {(!collapsed || open) && <span>{item.name}</span>}
      <span className={
        `${active ? activeSpanClass : inactiveSpanClass} 
        ${active ? '' : 'group-focus:w-[5px] group-focus:bg-white-400 group-hover:w-[5px] group-hover:bg-white-400'}`}></span>
    </NavLink>
  );
});

const Sidebar = ({ open, setOpen }) => {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Memoize sidebar list
  const sidebarList = useMemo(
    () => [
      { name: 'Dashboard', href: '/dashboard', icon: '📊' },
      { name: 'Inventory', href: '/inventory', icon: '📦' },
      { name: 'items', href: '/items', icon: '📂' },
      { name: 'Manufacturing', href: '/manufacturing', icon: '🏭' },
      { name: 'CRM', href: '/crm', icon: '👥' },
      { name: 'warehouse', href: '/warehouse', icon: '🏬' },
    ],
    []
  );

  // Compute activeIndex directly from pathname and sidebarList
  const activeIndex = useMemo(() => {
    return sidebarList.findIndex(item =>{return pathname.startsWith(item.href)});
    // return sidebarList.findIndex(item =>{ item.href === pathname });
  }, [pathname, sidebarList]);

  // Precompute classNames for NavLink and active span
  const navLinkClass = useMemo(
    () =>
      `group relative flex items-center justify-start gap-2 hover:text-action-hover py-1 px-3 focus:outline-none focus:text-action`,
    []
  );
  // const navLinkClassCollapsed = useMemo(
  //   () => navLinkClass + ' justify-center',
  //   [navLinkClass]
  // );
  const navLinkClassExpanded = navLinkClass + '';
  const activeSpanClass = useMemo(
    () =>
      `absolute w-[5px] h-[40%] left-0 bg-white-800 rounded-r-[3px] transition-all duration-300`,
    []
  );
  const inactiveSpanClass = useMemo(
    () =>
      `absolute w-[0px] h-[40%] left-0 bg-white-800 rounded-r-[3px] transition-all duration-300 `,
    []
  );

  // Debounced hover collapse/expand logic
  const hoverTimeout = useRef();
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setCollapsed(false), 80);
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setCollapsed(true), 80);
  }, []);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  // Close on Escape (mobile)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      
      <aside
        role="complementary"
        aria-label="Sidebar"
        aria-hidden={!open}
        className={cn(
          // base
          'bg-primary text-primary-text max-h-full overflow-hidden p-[17px] pt-2 transition-all duration-300',
          // layout: slide-in on mobile, static on desktop
          'fixed top-12 left-0 z-40 h-screen w-64 lg:static',
          // visibility: mobile uses `open`, desktop always visible
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          // width behavior only on lg
          collapsed ? 'lg:w-20' : 'lg:w-64',
          'w-full',
          // display rules so it’s hidden on mobile when closed, always block on lg
          // open ? 'block' : 'hidden',
          'lg:block'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn('h-full w-fit p-0 flex flex-col rounded-lg', collapsed ? 'lg:items-center' : 'lg:items-start')}
        >
          <nav className="relative flex-1 space-y-2 overflow-auto h-full w-full" id="sidebar_nav">
            {sidebarList.map((item, index) => (
              <SidebarItem
                open={open}
                setOpen={setOpen}
                key={index}
                item={item}
                index={index}
                collapsed={collapsed}
                active={activeIndex === index}
                navLinkClass={ navLinkClassExpanded}
                activeSpanClass={activeSpanClass}
                inactiveSpanClass={inactiveSpanClass}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;