import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Box, VStack, Button, Input, Select, Card, CardBody, CardHeader, Heading } from '@chakra-ui/react';
import { useFormValidation } from '@/shared/hooks';

interface Account {
    id?: number;
    code: string;
    name: string;
    type: string;
    subtype: string;
    parent_id?: number;
    description?: string;
    is_active: boolean;
}

interface AccountFormProps {
    account?: Account;
    accounts: Account[];
    onSubmit: (data: Account) => void;
    onCancel: () => void;
}

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
        subtype: account?.subtype || 'current_asset',
        parent_id: account?.parent_id || undefined,
        description: account?.description || '',
        is_active: account?.is_active ?? true,
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
            subtype: accountSubtypes[type as keyof typeof accountSubtypes]?.[0]?.value || '',
        });
    };

    const parentAccountOptions = accounts
        .filter(acc => acc.type === data.type && acc.id !== account?.id)
        .map(acc => ({
            value: acc.id?.toString() || '',
            label: `${acc.code} - ${acc.name}`,
        }));

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {account ? 'Edit Account' : 'Create New Account'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Account Code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                error={errors.code}
                                required
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div>
                            <Input
                                label="Account Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Cash"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Select
                                label="Account Type"
                                value={data.type}
                                onChange={(value) => handleTypeChange(value)}
                                options={accountTypes}
                                error={errors.type}
                                required
                            />
                        </div>
                        <div>
                            <Select
                                label="Account Subtype"
                                value={data.subtype}
                                onChange={(value) => setData('subtype', value)}
                                options={accountSubtypes[selectedType as keyof typeof accountSubtypes] || []}
                                error={errors.subtype}
                                required
                            />
                        </div>
                    </div>

                    {parentAccountOptions.length > 0 && (
                        <div>
                            <Select
                                label="Parent Account (Optional)"
                                value={data.parent_id?.toString() || ''}
                                onChange={(value) => setData('parent_id', value ? parseInt(value) : undefined)}
                                options={[
                                    { value: '', label: 'No Parent Account' },
                                    ...parentAccountOptions,
                                ]}
                                error={errors.parent_id}
                            />
                        </div>
                    )}

                    <div>
                        <Input
                            label="Description (Optional)"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            error={errors.description}
                            placeholder="Brief description of the account"
                            multiline
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
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
            </CardContent>
        </Card>
    );
}
