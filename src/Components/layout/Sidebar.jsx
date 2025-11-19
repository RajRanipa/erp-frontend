'use client';
import React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NavLink from '../NavLink';
import { cn } from '@/utils/cn';
import useAuthz from '@/hooks/useAuthz';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from '../toast';

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
      {...(open ? { onClick: () => setOpen(false) } : {})}
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
  const [loading, setLoading] = useState(true);
  // const [permissions, setPermissions] = useState([]); // [keys, setPermissions]
  const pathname = usePathname();

  // Memoize sidebar list
  const fullsidebarList = useMemo(
    () => [
      { name: 'Dashboard', href: '/dashboard', icon: '📊' },
      { name: 'Inventory', href: '/inventory', icon: '📦' },
      { name: 'items', href: '/items', icon: '📂' },
      { name: 'Manufacturing', href: '/manufacturing', icon: '🏭' },
      { name: 'CRM', href: '/crm', icon: '👥' },
      { name: 'Warehouses', href: '/warehouses', icon: '🏬' },
      { name: 'Users', href: '/users', icon: '👤' },
      { name: 'Settings', href: '/settings', icon: '⚙️' },
    ],
    []
  );

  // Prefer a stable permissions set over calling a changing `can` function.
  // Update your useAuthz hook to expose `permissions` (array of strings) if it doesn't already.
  const { permissions = [], can } = useAuthz();
  // useEffect(() => {
  //     (async () => {
  //       try {
  //         setLoading(true);
  //         const roleRes = await axiosInstance.get(`/api/permissions/by-role`);
  //         const keys = roleRes.data?.permissions || [];
  //         // console.log('roleRes', roleRes, keys);
  //         setPermissions(new Set(keys));
  //       } catch (e) {
  //         // setError(e.message || 'Failed to load role permissions');
  //         Toast.error(`Role load error: ${e.message}`, 'error');
  //       } finally {
  //         setLoading(false);
  //       }
  //     })();
  //   }, []);

  // Build a stable Set for O(1) checks; memoized so it only changes when permissions change.
  const allow = useMemo(() => new Set(permissions), [permissions]);
  // console.log('allow', allow);
  // Helper to test permission keys without relying on an unstable function reference.
  const hasPerm = useCallback((base) => {
    const key = String(base || '').toLowerCase();
    return (
      allow.has(`${key}:full`) ||
      allow.has(`${key}:read`) ||
      // Back-compat: some roles may grant module-wide access like 'dashboard:full'
      allow.has('*:full')
    );
  }, [allow]);

  // Filter once per permissions change; no console.log here to avoid noise on hover re-renders.
  const sidebarList = useMemo(() => {
    // If permissions are not available (e.g., before auth loads), show nothing to avoid flicker.
    // console.log('permissions', permissions); 
    if (!permissions || permissions.length === 0) return [];
    return fullsidebarList.filter(item => hasPerm(item.name));
  }, [fullsidebarList, permissions, hasPerm]);


  // Compute activeIndex directly from pathname and sidebarList
  const activeIndex = useMemo(() => {
    return sidebarList.findIndex(item => { return pathname.startsWith(item.href) });
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
        className={cn(
          // base
          'lg:bg-primary text-primary-text max-h-full overflow-hidden lg:p-[17px] lg:pt-2 transition-all lg:duration-300 duration-200 ',
          // layout: slide-in on mobile, static on desktop
          'fixed top-12 left-0 z-40 h-screen w-full lg:static bg-black-100/10 backdrop-blur-md',
          // visibility: mobile uses `open`, desktop always visible
          open ? 'backdrop-blur-xs' : 'backdrop-blur-[0px] z-0',
          'lg:translate-x-0',
          // width behavior only on lg
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // display rules so it’s hidden on mobile when closed, always block on lg
          // open ? 'block' : 'hidden',
          'lg:block'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...(open ? { onClick: () => setOpen(false) } : {})}
      >
        <div
          className={cn(
            'h-full w-56 lg:w-fit p-0 flex bg-primary flex-col rounded-r-lg lg:rounded-lg transition-all duration-300 lg:translate-x-0',
            collapsed ? 'lg:items-center' : 'lg:items-start',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
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
                navLinkClass={navLinkClassExpanded}
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