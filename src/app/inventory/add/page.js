'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '../../../lib/axiosInstance';
import Inventory from '../page';
import SelectInput from '@/components/SelectInput';
import { useToast } from '@/components/toast';

export default function AddProductPage() {
    const toast = useToast();
    const router = useRouter();
    // Step state
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [fetchingDimensions, setFetchingDimensions] = useState(false);
    const [fetchingDensities, setFetchingDensities] = useState(false);
    const [fetchingTemperatures, setFetchingTemperatures] = useState(false);
    const [fetchingPackings, setFetchingPackings] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    // Step options
    const [products, setProducts] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [densities, setDensities] = useState([]);
    const [temperatures, setTemperatures] = useState([]);
    const [packings, setPackings] = useState([]);
    // Step selected values
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedDimension, setSelectedDimension] = useState('');
    const [selectedDensity, setSelectedDensity] = useState('');
    const [selectedTemperature, setSelectedTemperature] = useState('');
    const [selectedPacking, setSelectedPacking] = useState('');

    // Step 1: fetch product names
    const fetchProducts = async () => {
        setFetchingProducts(true);
        try {
            const res = await axiosInstance.get('/api/products/names');
            if (res.data && Array.isArray(res.data)) {
                setProducts(res.data.map((name) => ({
                    label: name,
                    value: name,
                })));
            } else {
                setProducts([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load products');
            setProducts([]);
        }
        setFetchingProducts(false);
    };

    // Step 2: fetch dimensions for selected product
    const fetchDimensions = async (productName) => {
        setFetchingDimensions(true);
        try {
            const res = await axiosInstance.get('/api/products/dimensions', {
                params: { productname: productName }
            });
            if (res.data && Array.isArray(res.data)) {
                setDimensions(res.data.map((val) => ({
                    label: val,
                    value: val,
                })));
            } else {
                setDimensions([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load dimensions');
            setDimensions([]);
        }
        setFetchingDimensions(false);
    };

    // Step 3: fetch densities for selected product and dimension
    const fetchDensities = async (productName, dimension) => {
        setFetchingDensities(true);
        try {
            const res = await axiosInstance.get('/api/products/densities', {
                params: { productname: productName, dimension }
            });
            if (res.data && Array.isArray(res.data)) {
                setDensities(res.data.map((val) => ({
                    label: val,
                    value: val,
                })));
            } else {
                setDensities([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load densities');
            setDensities([]);
        }
        setFetchingDensities(false);
    };

    // Step 4: fetch temperatures for selected product, dimension, density
    const fetchTemperatures = async (productName, dimension, density) => {
        setFetchingTemperatures(true);
        try {
            const res = await axiosInstance.get('/api/products/temperatures', {
                params: { productname: productName, dimension, density }
            });
            if (res.data && Array.isArray(res.data)) {
                setTemperatures(res.data.map((val) => ({
                    label: val,
                    value: val,
                })));
            } else {
                setTemperatures([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load temperatures');
            setTemperatures([]);
        }
        setFetchingTemperatures(false);
    };

    // Step 5: fetch packings for selected product, dimension, density, temperature
    const fetchPackings = async (productName, dimension, density, temperature) => {
        setFetchingPackings(true);
        try {
            const res = await axiosInstance.get('/api/products/packings', {
                params: { productname: productName, dimension, density, temperature }
            });
            if (res.data && Array.isArray(res.data)) {
                setPackings(res.data.map((val) => ({
                    label: val,
                    value: val,
                })));
            } else {
                setPackings([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load packings');
            setPackings([]);
        }
        setFetchingPackings(false);
    };

    // Initial fetch
    useEffect(() => {
        fetchProducts();
    }, []);

    // Handlers for each step
    const handleProductChange = (eventOrValue) => {
        const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        setSelectedProduct(value);
        setSelectedDimension('');
        setSelectedDensity('');
        setSelectedTemperature('');
        setSelectedPacking('');
        setDimensions([]);
        setDensities([]);
        setTemperatures([]);
        setPackings([]);
        if (value) {
            fetchDimensions(value);
        }
    };
    const handleDimensionChange = (eventOrValue) => {
        const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        setSelectedDimension(value);
        setSelectedDensity('');
        setSelectedTemperature('');
        setSelectedPacking('');
        setDensities([]);
        setTemperatures([]);
        setPackings([]);
        if (selectedProduct && value) {
            fetchDensities(selectedProduct, value);
        }
    };
    const handleDensityChange = (eventOrValue) => {
        const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        setSelectedDensity(value);
        setSelectedTemperature('');
        setSelectedPacking('');
        setTemperatures([]);
        setPackings([]);
        if (selectedProduct && selectedDimension && value) {
            fetchTemperatures(selectedProduct, selectedDimension, value);
        }
    };
    const handleTemperatureChange = (eventOrValue) => {
        const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        setSelectedTemperature(value);
        setSelectedPacking('');
        setPackings([]);
        if (selectedProduct && selectedDimension && selectedDensity && value) {
            fetchPackings(selectedProduct, selectedDimension, selectedDensity, value);
        }
    };
    const handlePackingChange = (eventOrValue) => {
        const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        setSelectedPacking(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || !selectedDimension || !selectedDensity || !selectedTemperature || !selectedPacking) {
            toast({
                type: 'error',
                message: 'Please select all product options!',
                autoClose: true,
                placement: 'top-center',
            });
            return;
        }
        // Continue form submission logic with selected values
        toast({
            type: 'success',
            message: `Product ${selectedProduct} (${selectedDimension}, ${selectedDensity}, ${selectedTemperature}, ${selectedPacking}) selected successfully!`,
            autoClose: true,
            placement: 'top-center',
        });
        // Example: router.push('/next-step') or API call to save product
    };

    return (
        <Inventory>
            <h1 className="text-2xl font-bold mb-4">Add Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4 grid-rows-[min-content]">
                    {/* Step 1: Product */}
                    {products &&<SelectInput
                        options={products}
                        value={selectedProduct}
                        onChange={handleProductChange}
                        placeholder="Select a product"
                        disabled={fetchingProducts}
                    />}
                    {/* Step 2: Dimension */}
                    {dimensions.length > 0 && <SelectInput
                        options={dimensions}
                        value={selectedDimension}
                        onChange={handleDimensionChange}
                        placeholder="Select a dimension"
                        disabled={!selectedProduct || fetchingDimensions}
                    />}
                    {/* Step 3: Density */}
                    {densities.length > 0 && <SelectInput
                        options={densities}
                        value={selectedDensity}
                        onChange={handleDensityChange}
                        placeholder="Select a density"
                        disabled={!selectedDimension || fetchingDensities}
                    />}
                    {/* Step 4: Temperature */}
                    {temperatures.length > 0 && <SelectInput
                        options={temperatures}
                        value={selectedTemperature}
                        onChange={handleTemperatureChange}
                        placeholder="Select a temperature"
                        disabled={!selectedDensity || fetchingTemperatures}
                    />}
                    {/* Step 5: Packing */}
                    {packings.length > 0 && <SelectInput
                        options={packings}
                        value={selectedPacking}
                        onChange={handlePackingChange}
                        placeholder="Select a packing"
                        disabled={!selectedTemperature || fetchingPackings}
                    />}
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={loading}
                >
                    Save Product
                </button>
            </form>
        </Inventory>
    );
}