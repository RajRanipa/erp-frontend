'use client';

import NavLink from '@/Components/NavLink';
import useAuthz from '@/hooks/useAuthz';

export default function ParametersLayout({ children }) {
  const { can } = useAuthz();

  return (
    <div className="flex h-[stretch] grow flex-col">
      <div className="mb-3">
        <h2 className="text-xl font-bold">Item Parameters</h2>
        <p className="text-sm text-white-500">
          Manage the controlled values used to define Item specifications.
        </p>
      </div>

      <nav
        className="mb-3 flex w-full gap-4 rounded bg-white-100 px-3 py-2"
        aria-label="Item parameters"
      >
        {can('parameters:categories:read') && (
          <NavLink href="/items/parameters/catagory">Categories</NavLink>
        )}
        {can('parameters:producttypes:read') && (
          <NavLink href="/items/parameters/producttype">Product Types</NavLink>
        )}
        {can('parameters:densities:read') && (
          <NavLink href="/items/parameters/densites">Densities</NavLink>
        )}
        {can('parameters:temperatures:read') && (
          <NavLink href="/items/parameters/temperatures">Temperatures</NavLink>
        )}
        {can('parameters:dimensions:read') && (
          <NavLink href="/items/parameters/dimensions">Dimensions</NavLink>
        )}
      </nav>

      <div className="flex w-full flex-1 overflow-auto p-1">{children}</div>
    </div>
  );
}
