// src/app/items/create/page.js
'use client';
import React from 'react';
import Item from '../page';
import ItemForm from '../components/ItemForm'

export default function AddProductPage() {

    return (
        <Item>
            <h1 className="text-2xl font-bold mb-4">Create Product</h1>
            <ItemForm/>
        </Item>
    );
}