// src/app/items/page.js 
'use client';
import React, { useEffect, useState } from 'react';
import DisplayBar from '@/Components/layout/DisplayBar';
import DisplayMain from '@/Components/layout/DisplayMain';
import NavLink from '@/Components/NavLink';
import { axiosInstance } from '@/lib/axiosInstance';
import { Toast } from "@/Components/toast";
import useAuthz from '@/hooks/useAuthz';
import { addIcon } from '@/utils/SVG';
import Loading from '@/Components/Loading';
export default function Items({ children }) {

  const { can } = useAuthz();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (can('items:create')) setLoading(false);
  }, [can]);

  return (
    <>
      <div className="Items-page">
        item dashboard is in production
      </div>
    </>
  );
}