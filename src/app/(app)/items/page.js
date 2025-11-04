// src/app/items/page.js 
'use client';
import React, { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from "@/Components/toast";
import useAuthz from '@/hook/useAuthz';
export default function Items({ children }) {
  
  const { can } = useAuthz();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    
  useEffect(() => {
        const fetchItems = async () => {
            console.log("fetchItems called");
            try {
                const response = await axiosInstance.get('/api/items')
                // console.log("response", response);
                setItems(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
                Toast.error("Failed to fetch campaign");
            }
        };
        // fetchItems();
    }, []);
    
  return (
    <>
      <DisplayBar title="Items" href="/items">
        <div className="flex gap-4">
          <NavLink
            href="/items/finished"
            className="cursor-pointer"
            // onClick={() => setFilterType('finished')}
          >
            Finished Goods
          </NavLink>
          <NavLink
            href="/items/raw"
            // onClick={() => setFilterType('raw')}
          >
            Raw Material
          </NavLink>
          <NavLink
            href="/items/packing"
            // onClick={() => setFilterType('packing')}
          >
            Packing Material
          </NavLink>
        </div>
        <div className='flex gap-2'>
          {can('items:create') && (
            <NavLink href="/items/create" type={"button"}> Create Item </NavLink>
          )}
        </div>
      </DisplayBar>
      <DisplayMain>
        {children ? children : (
          <div className="Items-page">
            item dashboard is in production
          </div>)
        }
      </DisplayMain>
    </>
  );
}

// {/* {
//   _id: new ObjectId('68d4d74d347b19d635da110e'),
//   name: 'woven bag',
//   sku: 'ITEM-WOV-001',
//   category: new ObjectId('68cfe5a6c52171ccf85b645e'),
//   categoryKey: 'PACKING',
//   product_unit: 'pcs',
//   currentStock: null,
//   minimumStock: null,
//   purchasePrice: 0,
//   salePrice: 0,
//   description: '',
//   productType: new ObjectId('68cfe6eec52171ccf85b647c'),
//   dimension: new ObjectId('68d4d370da237f687a1804f0'),
//   isArchived: false,
//   brandType: 'branded',
//   productColor: 'blue',
//   createdAt: 2025-09-25T05:46:53.338Z,
//   updatedAt: 2025-09-25T05:46:53.338Z,
//   __v: 0
// } */}