// src/app/items/edit/[id]/page.js
'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Item from '../../page';
import ItemForm from '../../components/ItemForm';
import { axiosInstance } from '@/lib/axiosInstance';

export default function EditProductPage() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const queryParams = {
        id : id
    }
    useEffect(() => {
        async function fetchItem() {
            try {
                const res = await axiosInstance.get(`/api/items/by-id`, { params: queryParams });
                // console.log("item", res.data);
                if(res.data){
                    let item = res.data;
                    console.log("item", item);
                    setItem(item);  // axios automatically parses JSON
                }
            } catch (error) {
                console.error("Failed to fetch item:", error);
                setItem(null);
            }
        }
        if (id) {
            fetchItem();
        }
    }, [id]);

    return (
        <Item>
            <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
            {item && <ItemForm initialData={item} mode='edit' />}
        </Item>
    );
}