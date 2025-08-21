// src/app/inventory/page.js (or any route)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { axiosInstance } from '@/../lib/axiosInstance'; // Adjust path if needed
import DashboardLayout from '@/components/layout/DashboardLayout';
import DisplayBar from '@/components/layout/DisplayBar';
import DisplayMain from '@/components/layout/DisplayMain';
import NavLink from '@/components/NavLink';

export default function InventoryPage({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [filterType, setFilterType] = useState('finished');
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === '/inventory';

  // Fetch products (with optional search and filterType)
  const fetchProducts = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get('/api/products');
      // console.log(res);
      if (res.data) {
        setProducts(res.data.data);
      } else {
        setProducts([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      setProducts([]);
    }
    setFetching(false);
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    // fetchProducts();
    // eslint-disable-next-line
  }, []);

  return (
    <DashboardLayout>
      <DisplayBar title="Inventory" >
        <div className="flex gap-4">
          <NavLink
            href="/inventory"
            className="cursor-pointer"
            activeClass='cursor-pointer text-blue-600'
            inactiveClass='cursor-pointer text-gray-600 hover:text-blue-400'
            onClick={() => setFilterType('finished')}
          >
            Finished Goods
          </NavLink>
          <NavLink
            href="/inventory?type=raw"
            activeClass="cursor-pointer text-blue-600"
            inactiveClass="cursor-pointer text-gray-600 hover:text-blue-400"
            onClick={() => setFilterType('raw')}
          >
            Raw Material
          </NavLink>
        </div>
        <div className='flex gap-2'>
          <NavLink
            href="/inventory/add"
            activeClass="cursor-pointer px-2 py-1 rounded text-white bg-blue-500"
            inactiveClass="cursor-pointer px-2 py-1 rounded text-gray-900 hover:text-blue-500 bg-gray-300"
          >
            Add Product
          </NavLink>
          <NavLink
            href="/inventory/create"
            activeClass="cursor-pointer px-2 py-1 rounded text-white bg-blue-500"
            inactiveClass="cursor-pointer px-2 py-1 rounded text-gray-900 hover:text-blue-500 bg-gray-300"
          >
            Create Product
          </NavLink>
        </div>
      </DisplayBar>
      <DisplayMain>
        {children ? children : (
          <div className="inventory-page">

            <div className="mb-4 flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-2 py-2 min-w-[220px] rounded border border-gray-300"
              />
            </div>
            {loading || fetching ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto shadow-md">
                <table className="w-full border-collapse  ">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border-b border-gray-200 text-left">Category</th>
                      <th className="p-2 border-b border-gray-200 text-left">Name</th>
                      <th className="p-2 border-b border-gray-200 text-left">Packing</th>
                      <th className="p-2 border-b border-gray-200 text-right">Current Stock</th>
                      <th className="p-2 border-b border-gray-200 text-right">Reorder Level</th>
                      <th className="p-2 border-b border-gray-200 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-5 text-center text-gray-500">
                          No products found.
                        </td>
                      </tr>
                    )}
                    {console.log(products)}
                    {products.length ? products.map(product => {
                      {/* { console.log("product", product) } */}
                      const isLowStock = product.openingStock < product.minimumStock;
                      return (
                        <tr
                          key={product.id || product.sku}
                          className={isLowStock ? 'bg-red-50' : ''}
                        >
                          <td className="p-2 font-medium">
                            {product.category}{' '}
                            {isLowStock && (
                              <span className="ml-2 bg-red-500 text-white rounded text-xs px-2 py-0.5 align-middle">
                                Low Stock
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {product.productName}
                            {product?.dimension && (
                              <div className="text-xs text-gray-500">
                                {product.dimension.length} x
                                {product.dimension.width} x
                                {product.dimension.thickness}
                                {' '}{product.dimension.unit}
                              </div>
                            )}
                            {product?.density && (
                              <div className="text-xs text-gray-500">
                                {product.density.value}
                                {' '}{product.density.unit}
                              </div>
                            )}
                            {product?.temperature && (
                              <div className="text-xs text-gray-500">
                                {product.temperature.value}
                                {' '}{product.temperature.unit}
                              </div>
                            )}
                            
                          </td>
                          <td className="p-2 text-left">{product.packingType.name}</td>
                          <td className="p-2 text-right">{product.openingStock}</td>
                          <td className="p-2 text-right">{product.minimumStock}</td>
                          <td className="p-2 text-center">
                          </td>
                        </tr>
                      );
                    }) : null
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>)
        }
      </DisplayMain>
    </DashboardLayout>
  );
}