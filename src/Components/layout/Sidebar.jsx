'use client';
import React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NavLink from '../NavLink';

// Memoized SidebarItem component
const SidebarItem = React.memo(function SidebarItem({
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
    >
      <span className="text-xl">{item.icon}</span>
      {!collapsed && <span>{item.name}</span>}
      <span className={
        `${active ? activeSpanClass : inactiveSpanClass} 
        ${active ? '' : 'group-focus:w-[5px] group-focus:bg-white-400 group-hover:w-[5px] group-hover:bg-white-400'}`}></span>
    </NavLink>
  );
});

const Sidebar = () => {
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
      `group relative flex items-center gap-2 hover:text-action-hover py-1 px-3 focus:outline-none focus:text-action`,
    []
  );
  const navLinkClassCollapsed = useMemo(
    () => navLinkClass + ' justify-center',
    [navLinkClass]
  );
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

  return (
    <aside
      className={`${collapsed ? 'w-25' : 'w-64'} bg-primary text-primary-text max-h-full overflow-hidden p-2 transition-all duration-300`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`h-full p-3 flex flex-col rounded-lg ${collapsed ? 'items-center' : 'items-start'
          }`}
      >
        <nav className="relative flex-1 space-y-2 overflow-auto h-full w-full" id="sidebar_nav">
          {sidebarList.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              index={index}
              collapsed={collapsed}
              active={activeIndex === index}
              navLinkClass={collapsed ? navLinkClassCollapsed : navLinkClassExpanded}
              activeSpanClass={activeSpanClass}
              inactiveSpanClass={inactiveSpanClass}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;