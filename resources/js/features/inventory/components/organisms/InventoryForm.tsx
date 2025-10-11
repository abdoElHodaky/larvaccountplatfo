/**
 * Inventory Form Component
 * Form for creating and editing inventory items
 */

import React, { useState } from 'react';

interface InventoryItem {
    id?: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    category: string;
    description?: string;
    minStockLevel?: number;
    supplier?: string;
    location?: string;
}

interface InventoryFormProps {
    item?: InventoryItem;
    onSubmit?: (item: InventoryItem) => void;
    onCancel?: () => void;
    isEditing?: boolean;
    className?: string;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
    item,
    onSubmit,
    onCancel,
    isEditing = false,
    className = '',
}) => {
    const [formData, setFormData] = useState<InventoryItem>({
        name: item?.name || '',
        sku: item?.sku || '',
        quantity: item?.quantity || 0,
        unitPrice: item?.unitPrice || 0,
        category: item?.category || '',
        description: item?.description || '',
        minStockLevel: item?.minStockLevel || 0,
        supplier: item?.supplier || '',
        location: item?.location || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const categories = [
        'Supplies',
        'Equipment',
        'Furniture',
        'Electronics',
        'Materials',
        'Tools',
        'Other',
    ];

    const locations = ['Warehouse A', 'Warehouse B', 'Office Storage', 'Retail Floor', 'Back Room'];

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Item name is required';
        }

        if (!formData.sku.trim()) {
            newErrors.sku = 'SKU is required';
        }

        if (formData.quantity < 0) {
            newErrors.quantity = 'Quantity cannot be negative';
        }

        if (formData.unitPrice <= 0) {
            newErrors.unitPrice = 'Unit price must be greater than 0';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (formData.minStockLevel && formData.minStockLevel < 0) {
            newErrors.minStockLevel = 'Minimum stock level cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit?.(formData);
        }
    };

    const handleInputChange = (field: keyof InventoryItem, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const generateSKU = () => {
        const prefix = formData.category.substring(0, 3).toUpperCase();
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        const sku = `${prefix}-${random}`;
        handleInputChange('sku', sku);
    };

    return (
        <div className={`inventory-form ${className}`}>
            <div className='bg-white rounded-lg shadow-sm border'>
                <div className='p-6 border-b'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                        {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                        {isEditing
                            ? 'Update the item details below'
                            : 'Fill in the details for the new inventory item'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Item Name */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Item Name *
                            </label>
                            <input
                                type='text'
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder='Enter item name'
                            />
                            {errors.name && (
                                <p className='text-red-600 text-xs mt-1'>{errors.name}</p>
                            )}
                        </div>

                        {/* SKU */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                SKU *
                            </label>
                            <div className='flex'>
                                <input
                                    type='text'
                                    value={formData.sku}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.sku ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder='Enter SKU'
                                />
                                <button
                                    type='button'
                                    onClick={generateSKU}
                                    className='px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 text-sm'
                                >
                                    Generate
                                </button>
                            </div>
                            {errors.sku && (
                                <p className='text-red-600 text-xs mt-1'>{errors.sku}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.category ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value=''>Select a category</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className='text-red-600 text-xs mt-1'>{errors.category}</p>
                            )}
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Quantity *
                            </label>
                            <input
                                type='number'
                                min='0'
                                value={formData.quantity}
                                onChange={(e) =>
                                    handleInputChange('quantity', parseInt(e.target.value) || 0)
                                }
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder='0'
                            />
                            {errors.quantity && (
                                <p className='text-red-600 text-xs mt-1'>{errors.quantity}</p>
                            )}
                        </div>

                        {/* Unit Price */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Unit Price *
                            </label>
                            <div className='relative'>
                                <span className='absolute left-3 top-2 text-gray-500'>$</span>
                                <input
                                    type='number'
                                    min='0'
                                    step='0.01'
                                    value={formData.unitPrice}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'unitPrice',
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.unitPrice ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder='0.00'
                                />
                            </div>
                            {errors.unitPrice && (
                                <p className='text-red-600 text-xs mt-1'>{errors.unitPrice}</p>
                            )}
                        </div>

                        {/* Minimum Stock Level */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Minimum Stock Level
                            </label>
                            <input
                                type='number'
                                min='0'
                                value={formData.minStockLevel || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'minStockLevel',
                                        parseInt(e.target.value) || 0
                                    )
                                }
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.minStockLevel ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder='0'
                            />
                            {errors.minStockLevel && (
                                <p className='text-red-600 text-xs mt-1'>{errors.minStockLevel}</p>
                            )}
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Supplier
                            </label>
                            <input
                                type='text'
                                value={formData.supplier || ''}
                                onChange={(e) => handleInputChange('supplier', e.target.value)}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Enter supplier name'
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Location
                            </label>
                            <select
                                value={formData.location || ''}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value=''>Select a location</option>
                                {locations.map((location) => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className='mt-6'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Description
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Enter item description (optional)'
                        />
                    </div>

                    {/* Form Actions */}
                    <div className='flex justify-end space-x-3 mt-8 pt-6 border-t'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700'
                        >
                            {isEditing ? 'Update Item' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryForm;
