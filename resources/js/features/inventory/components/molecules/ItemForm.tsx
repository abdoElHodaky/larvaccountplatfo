/**
 * Item Form Component
 * Phase 9: Basic inventory structure
 */

import React, { useState } from 'react';

interface ItemFormData {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    category: string;
    description?: string;
}

interface ItemFormProps {
    initialData?: Partial<ItemFormData>;
    onSubmit: (data: ItemFormData) => void;
    onCancel?: () => void;
    loading?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({
    initialData = {},
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        sku: '',
        quantity: 0,
        price: 0,
        category: '',
        description: '',
        ...initialData,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof ItemFormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
                <label className='block text-sm font-medium text-gray-700'>Item Name</label>
                <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                    required
                />
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700'>SKU</label>
                <input
                    type='text'
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                    required
                />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700'>Quantity</label>
                    <input
                        type='number'
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                        min='0'
                        required
                    />
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700'>Price</label>
                    <input
                        type='number'
                        step='0.01'
                        value={formData.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                        min='0'
                        required
                    />
                </div>
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700'>Category</label>
                <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                    required
                >
                    <option value=''>Select a category</option>
                    <option value='electronics'>Electronics</option>
                    <option value='clothing'>Clothing</option>
                    <option value='books'>Books</option>
                    <option value='home'>Home & Garden</option>
                    <option value='other'>Other</option>
                </select>
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700'>Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                />
            </div>

            <div className='flex justify-end space-x-3'>
                {onCancel && (
                    <button
                        type='button'
                        onClick={onCancel}
                        className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type='submit'
                    disabled={loading}
                    className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                >
                    {loading ? 'Saving...' : 'Save Item'}
                </button>
            </div>
        </form>
    );
};

export default ItemForm;
