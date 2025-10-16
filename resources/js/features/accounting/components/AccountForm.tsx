import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/shared/components/atoms/Button';
import { FormInput } from '@/shared/components/molecules/FormInput';
import { FormSelect } from '@/shared/components/molecules/FormSelect';
import { CardContainer } from '@/shared/components/molecules/Container';
import { Text } from '@chakra-ui/react';
import { Account, AccountFormProps } from '@/shared/types/ACCOUNTTYPES';

const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
];

const accountSubtypes = {
    asset: [
        { value: 'current_asset', label: 'Current Asset' },
        { value: 'fixed_asset', label: 'Fixed Asset' },
        { value: 'other_asset', label: 'Other Asset' },
    ],
    liability: [
        { value: 'current_liability', label: 'Current Liability' },
        { value: 'long_term_liability', label: 'Long-term Liability' },
        { value: 'other_liability', label: 'Other Liability' },
    ],
    equity: [
        { value: 'owner_equity', label: 'Owner\'s Equity' },
        { value: 'retained_earnings', label: 'Retained Earnings' },
    ],
    revenue: [
        { value: 'operating_revenue', label: 'Operating Revenue' },
        { value: 'other_revenue', label: 'Other Revenue' },
    ],
    expense: [
        { value: 'operating_expense', label: 'Operating Expense' },
        { value: 'other_expense', label: 'Other Expense' },
    ],
};

export default function AccountForm({ account, accounts, onSubmit, onCancel }: AccountFormProps) {
    const { data, setData, processing, errors } = useForm<Account>({
        code: account?.code || '',
        name: account?.name || '',
        type: account?.type || 'asset',
        subType: account?.subType || 'current_asset',
        parentId: account?.parentId || undefined,
        description: account?.description || '',
        isActive: account?.isActive ?? true,
    });

    const [selectedType, setSelectedType] = useState(data.type);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        setData({
            ...data,
            type,
            subType: accountSubtypes[type as keyof typeof accountSubtypes]?.[0]?.value || '',
        });
    };

    const parentAccountOptions = accounts
        .filter((acc: Account) => acc.type === data.type && acc.id !== account?.id)
        .map((acc: Account) => ({
            value: acc.id?.toString() || '',
            label: `${acc.code} - ${acc.name}`,
        }));

    return (
        <CardContainer 
            className="w-full max-w-2xl mx-auto"
            header={
                <Text fontSize="xl" fontWeight="bold">
                    {account ? 'Edit Account' : 'Create New Account'}
                </Text>
            }
        >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormInput
                                label="Account Code"
                                value={data.code}
                                onChange={(value) => setData('code', value as string)}
                                error={errors.code}
                                isRequired
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div>
                            <FormInput
                                label="Account Name"
                                value={data.name}
                                onChange={(value) => setData('name', value as string)}
                                error={errors.name}
                                isRequired
                                placeholder="e.g., Cash"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormSelect
                                label="Account Type"
                                value={data.type}
                                onChange={(value) => handleTypeChange(value)}
                                options={accountTypes}
                                error={errors.type}
                                isRequired
                            />
                        </div>
                        <div>
                            <FormSelect
                                label="Account Subtype"
                                value={data.subType}
                                onChange={(value) => setData('subType', value)}
                                options={accountSubtypes[selectedType as keyof typeof accountSubtypes] || []}
                                error={errors.subType}
                                isRequired
                            />
                        </div>
                    </div>

                    {parentAccountOptions.length > 0 && (
                        <div>
                            <FormSelect
                                label="Parent Account (Optional)"
                                value={data.parentId?.toString() || ''}
                                onChange={(value) => setData('parentId', value ? parseInt(value) : undefined)}
                                options={[
                                    { value: '', label: 'No Parent Account' },
                                    ...parentAccountOptions,
                                ]}
                                error={errors.parentId}
                            />
                        </div>
                    )}

                    <div>
                        <FormInput
                            label="Description (Optional)"
                            value={data.description}
                            onChange={(value) => setData('description', value as string)}
                            error={errors.description}
                            placeholder="Brief description of the account"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={data.isActive}
                            onChange={(e) => setData('isActive', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active Account
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            loading={processing}
                        >
                            {account ? 'Update Account' : 'Create Account'}
                        </Button>
                    </div>
                </form>
        </CardContainer>
    );
}
